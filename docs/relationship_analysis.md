# Relationship Analysis — Phase 3 (concrete & actionable)

This document provides a field-by-field relationship analysis of the Django models, concrete EF Core mapping recommendations, index/constraint guidance, query/loading patterns, transaction & concurrency guidance (especially for payments and tenancy flows), and a testing checklist. Use this as the authoritative reference when scaffolding `Domain` entities and `AppDbContext` configurations.

Contents
- Per-model field mapping (Django -> recommended C# type) and FK details
- Relationship table (multiplicity, delete behavior, nullability)
- EF Core Fluent API snippets (for each model)
- Index, constraint and performance recommendations
- Transactional boundaries, concurrency and idempotency recommendations
- Migration notes (SQLite -> Postgres specifics)
- Testing checklist for relationships and critical flows

1) Per-model field mapping and notes
----------------------------------

Tenant (Django: `accounts.models.Tenant` — inherits AbstractUser)
- Important fields (existing via AbstractUser):
  - id (PK): Django uses integer or UUID depending on settings; in source it inherits AbstractUser with default integer PK. Recommendation: use Guid for IdentityUser<Guid> in .NET for safer distributed scenarios. If you prefer integer for parity, use int.
  - username: string (numeric regex in serializer) — validate with FluentValidation.
  - email: string
  - first_name, last_name: string
  - id_image: ImageField -> store as string URL or path: `string? IdImageUrl` (nullable)
  - age: IntegerField -> `int? Age`

AuthToken
- Fields:
  - id (PK): int
  - user: OneToOne -> Tenant: `Guid UserId` or `int UserId` depending on Tenant PK
  - token: string (unique) -> `string Token` (store hashed version in DB for security)
  - created_at: DateTimeOffset CreatedAt

Manager
- Fields:
  - user: OneToOne -> Tenant (map same as AuthToken)

Property (`my_properties.models.Property`)
- Fields:
  - id: int
  - name: string (unique) -> modelBuilder.HasIndex(p => p.Name).IsUnique();
  - location: string
  - image_url: string? -> Photo/URL stored as string
  - no_of_units: int? -> `int?`
  - no_of_floors: int? -> `int?`
  - availability: bool -> `bool Availability`

Unit (`my_properties.models.Unit`)
- Fields:
  - id: int
  - property: FK -> `int PropertyId` (required)
  - floor: int
  - room_number: string? (nullable)
  - image_url: string
  - cost: int? (amount in pesewas) -> `long? Cost`
  - max_no_of_people: int? -> `int?`
  - availability: bool (default true)
  - unit_type: string (choices: 'studio', '1bed') -> map to enum or string
- Constraints:
  - UniqueConstraint(fields=['property', 'room_number']) -> EF: HasIndex(u => new { u.PropertyId, u.RoomNumber }).IsUnique();

Image (`my_properties.models.Image`)
- Fields:
  - id
  - property: FK -> int? PropertyId
  - unit: FK -> int? UnitId
  - description: string
  - photo: ImageField -> string PhotoUrl

Tenancy_Agreement (`my_tenancy.models.Tenancy_Agreement`)
- Fields:
  - id
  - contract_start_date: Date -> `DateOnly ContractStartDate` (or DateTime for simplicity)
  - contract_duration: int -> `int ContractDurationMonths`
  - contract_end_date: Date? -> `DateOnly? ContractEndDate`
  - tenant: FK -> `Guid TenantId` (or int)
  - property: FK -> `int PropertyId`
  - unit: FK -> `int UnitId`
  - total_amount_paid: int? -> `long? TotalAmountPaid`
- Business logic: contract_end_date computed from start_date + duration — implement as a domain method or in the tenancy service to keep persistence clean.

Payment (`my_payments.models.Payment`)
- Fields:
  - id
  - email: string
  - amount: int (pesewas) -> `long Amount`
  - currency: string (max 5)
  - phone: string
  - provider: string (choices) -> map to enum or string
  - reference: string unique -> EF unique index, store as string
  - status: string -> map to enum (Pending, Success, Completed, Failed)
  - channel: string
  - created_at: DateTimeOffset
  - unit: FK -> int UnitId
  - tenant: FK -> Guid TenantId
  - tenancy_agreement: FK -> int? TenancyAgreementId (nullable)

PaymentSummary (`my_payments.models.PaymentSummary`)
- Fields:
  - id
  - tenancy_agreement: OneToOne -> int TenancyAgreementId (required)
  - total_amount_paid: int -> `long TotalAmountPaid`
  - amount_left: int -> `long AmountLeft`
  - last_payment_date: Date? -> `DateOnly? LastPaymentDate`
- Business logic: Aggregates payments related to tenancy; should be done inside a transactional service or via DB-side aggregate.

2) Relationship table (concrete)
--------------------------------

| Source Entity | FK | Target Entity | Multiplicity | Nullable | Recommended EF DeleteBehavior | Notes |
|---------------|----|---------------|-------------:|:--------:|-----------------------------|-------|
| TenancyAgreement | TenantId | Tenant | N:1 | No | Cascade | Required link to tenant; if tenant removed, tenancy likely should be removed (business decision)
| TenancyAgreement | PropertyId | Property | N:1 | No | Cascade | tenancy belongs to a property
| TenancyAgreement | UnitId | Unit | N:1 | No | Cascade | tenancy belongs to a unit
| Unit | PropertyId | Property | N:1 | No | Cascade | delete property -> delete units by default
| Image | PropertyId | Property | N:1 | Yes | Cascade | image optional
| Image | UnitId | Unit | N:1 | Yes | Cascade | image optional
| Payment | TenantId | Tenant | N:1 | No | Cascade | payments belong to tenant
| Payment | UnitId | Unit | N:1 | No | Cascade | payments belong to unit
| Payment | TenancyAgreementId | TenancyAgreement | N:1 | Yes | SetNull or Cascade | webhook may set this; prefer SetNull to retain payment records if tenancy deleted
| PaymentSummary | TenancyAgreementId | TenancyAgreement | 1:1 | No | Cascade | one-to-one required; PaymentSummary owns FK
| AuthToken | UserId | Tenant | 1:1 | No | Cascade | used for token blacklist

Decision note: where business logic demands preservation of historical records (payments), prefer `DeleteBehavior.SetNull` or prevent deletion of parent (restrict). Where tenancy lifecycle ties tightly to parent, `Cascade` is acceptable. Document chosen behavior in design.

3) EF Core Fluent API snippets (concrete)
--------------------------------------

AppDbContext.OnModelCreating should register configurations. Example snippets below.

Unit unique constraint
```csharp
builder.Entity<Unit>(b => {
    b.HasKey(u => u.Id);
    b.HasIndex(u => new { u.PropertyId, u.RoomNumber }).IsUnique();
    b.HasOne(u => u.Property).WithMany(p => p.Units).HasForeignKey(u => u.PropertyId).OnDelete(DeleteBehavior.Cascade);
});
```

Payment unique reference and indexes
```csharp
builder.Entity<Payment>(b => {
    b.HasKey(p => p.Id);
    b.HasIndex(p => p.Reference).IsUnique();
    b.HasIndex(p => p.TenancyAgreementId);
    b.HasOne(p => p.TenancyAgreement).WithMany(t => t.Payments).HasForeignKey(p => p.TenancyAgreementId).OnDelete(DeleteBehavior.SetNull);
    b.HasOne(p => p.Tenant).WithMany(t => t.Payments).HasForeignKey(p => p.TenantId).OnDelete(DeleteBehavior.Cascade);
});
```

PaymentSummary one-to-one
```csharp
builder.Entity<PaymentSummary>(b => {
    b.HasKey(ps => ps.Id);
    b.HasOne(ps => ps.TenancyAgreement).WithOne(t => t.PaymentSummary).HasForeignKey<PaymentSummary>(ps => ps.TenancyAgreementId).OnDelete(DeleteBehavior.Cascade);
});
```

Image mapping
```csharp
builder.Entity<Image>(b => {
    b.HasKey(i => i.Id);
    b.HasOne(i => i.Property).WithMany(p => p.Images).HasForeignKey(i => i.PropertyId).OnDelete(DeleteBehavior.Cascade);
    b.HasOne(i => i.Unit).WithMany(u => u.Images).HasForeignKey(i => i.UnitId).OnDelete(DeleteBehavior.Cascade);
});
```

4) Index and performance recommendations
--------------------------------------
- Unique indexes: `Properties(Name)`, `Units(PropertyId, RoomNumber)`, `Payments(Reference)`.
- Foreign key indexes: add indexes on FK columns used frequently in queries: `Payments(TenancyAgreementId)`, `Payments(UnitId)`, `TenancyAgreement(TenantId)`.
- Query patterns:
  - List properties with top N units: use projections to avoid loading unneeded fields.
  - PaymentHistory: query PaymentSummary with `.Include(ps => ps.TenancyAgreement).ThenInclude(t => t.Unit).ThenInclude(u => u.Property)` only when necessary; otherwise project fields.
- Use pagination for list endpoints (skip/take) and add `ORDER BY` indexes where needed.

5) Transactional boundaries and concurrency (critical for payments)
----------------------------------------------------------------

Payment initialization (API: initialize_payment)
- Recommended flow:
  1. Validate input and confirm unit availability (read Unit with `FOR UPDATE` / row lock in a transaction if you intend to reserve unit immediately).
  2. Create Payment row with status `Pending` and unique `Reference` inside a DB transaction.
  3. Call external payment gateway (Paystack) — do this outside the DB transaction to avoid long transactions, but keep the pending payment record.
  4. Return init response to client with payment gateway URL.

Webhook processing (Paystack webhook -> paystack_webhook)
- Recommended flow (idempotent):
  1. Verify webhook HMAC signature using secret.
  2. Parse payload and extract `reference` and `status`.
  3. Start DB transaction.
  4. Query Payment by `Reference` FOR UPDATE (lock row) to prevent concurrent processing.
  5. If Payment.Status is already `success` or `completed`, abort and return 200 (idempotent).
  6. Update Payment fields (status, amount if provided), link TenancyAgreement (get_or_create), update Unit.Availability=false, update/create PaymentSummary via an application service.
  7. Commit transaction and return 200.

Concurrency notes
- Use row-level locking when updating Payments and Units in webhook flows to avoid race conditions.
- Consider adding a `RowVersion` (timestamp/byte[]) concurrency column to TenancyAgreement and PaymentSummary for optimistic concurrency if multiple services may update the same aggregates.

Potential race conditions and mitigations
- Two webhooks arrive concurrently for same reference: use SELECT ... FOR UPDATE or update with WHERE status != 'success' to ensure only one succeeds.
- PaymentSummary.aggregate and TenancyAgreement.total_amount_paid syncing: calculate PaymentSummary from payments in a transaction and then persist both Payment and PaymentSummary atomically.

6) Eager-loading vs projection recommendations
--------------------------------------------
- When returning PaymentSummary with nested payments (as Django serializer does), use projection to a DTO to fetch only required fields:

```csharp
var summaries = await _context.PaymentSummaries
    .Where(ps => ps.TenancyAgreement.TenantId == tenantId)
    .Select(ps => new PaymentSummaryDto {
        PropertyName = ps.TenancyAgreement.Property.Name,
        TotalAmountPaid = ps.TotalAmountPaid,
        AmountLeft = ps.AmountLeft,
        LastPaymentDate = ps.LastPaymentDate,
        Payments = ps.TenancyAgreement.Payments.Select(p => new PaymentDto { Reference = p.Reference, Amount = p.Amount, Status = p.Status }).ToList()
    })
    .ToListAsync();
```

- Avoid `.Include` chains unless you need full graph; prefer `.Select` projection into DTOs to reduce memory and avoid N+1.

7) Migration notes (SQLite -> Postgres)
-------------------------------------
- Data types: SQLite is dynamic typed; Postgres has stricter types. Pay attention to:
  - DateOnly and DateTime: map to `timestamp without time zone` or `date` appropriately.
  - Boolean: SQLite uses integer, Postgres uses boolean.
  - Text/VarChar lengths: ensure EF Core defines lengths where necessary to avoid schema surprises.
- Migrations approach:
  - Generate EF Core migrations targeting Postgres provider (`UseNpgsql`) to create production schema.
  - Use data importer tool to copy rows from SQLite to Postgres instead of relying on migrations to move data.
  - Take care with identity/sequence values for integer PKs: reset sequences after import (Postgres `setval`).

8) Testing checklist (relationship-focused)
----------------------------------------
- Unit tests (Application services)
  - TenancyService.CreateAgreement creates ContractEndDate correctly for given duration.
  - PaymentService.Initialize creates Payment with status `Pending` and unique Reference.
  - PaymentService.Verify updates Payment status to `Completed` and marks Unit availability false.

- Integration tests (Db + controllers)
  - Creating a Property then Unit then TenancyAgreement establishes FK relationships and can be queried with `Include`.
  - Unique constraint on (PropertyId, RoomNumber) enforced: test insertion of duplicate fails.
  - Payment webhook idempotency: simulate duplicate webhook events produce single processed payment.
  - Transactional integrity: simulate failure after payment creation before verification and assert DB consistency.

- Performance & load tests
  - Payment initialization peak load (simulate external gateway latency) and ensure DB is robust under concurrent inits.
  - Payment history query uses projection and returns within acceptable latency for common dataset sizes.

9) Edge cases and suggested handling
----------------------------------
- Null tenancy_agreement on Payment: some payments may be initialized before tenancy is created — keep TenancyAgreementId nullable and link later in webhook or after user confirms.
- Unit availability race: when multiple tenants initialize payment for same unit, avoid double booking by reserving unit on first successful payment verify and using locks during verify. Optionally implement a reservation TTL.
- Deleted tenants: decide whether to allow tenancy or payment records to persist after tenant deletion. Prefer soft deletes for Tenant to preserve history.
- Soft deletes: consider `IsDeleted` flag on domain entities if legal/audit history is important; enforce global query filters in EF Core.

10) Deliverables from Phase 3
----------------------------
- `docs/relationship_analysis.md` (this file) — authoritative mapping and guidance for EF Core configuration, transactions, concurrency and migration.
- Next recommended action: implement `Domain` entities and `Infrastructure/Configurations` classes following the snippets above, then create EF Core migrations targeted at Postgres and run the DataImporter to migrate dev data.

If you want, I can now scaffold the Domain entity C# files and the Infrastructure `AppDbContext` with the configurations shown above so you have a compileable starting point. Otherwise confirm and I'll proceed to Phase 4 and produce the detailed mapping doc (Domain -> DTO -> Service -> Controller for each model).

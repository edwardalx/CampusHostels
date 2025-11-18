# Model Relationship Matrix

This file lists every foreign-key relationship discovered in the Django project, with multiplicity, nullability and recommended EF Core mapping (DeleteBehavior, C# types).

| From Model | FK Field | To Model | Multiplicity | DeleteBehavior (recommended) | Nullable | C# type (FK) | Notes |
|------------|----------|----------|--------------:|-----------------------------|:--------:|:------------:|-------|
| Tenancy_Agreement | tenant_id | Tenant | Many TenancyAgreement -> One Tenant (1:N) | Cascade | No | Guid TenantId | Tenant is required (AUTH_USER_MODEL) |
| Tenancy_Agreement | property_id | Property | Many -> One (1:N) | Cascade | No | int PropertyId | tenancy references property |
| Tenancy_Agreement | unit_id | Unit | Many -> One (1:N) | Cascade | No | int UnitId | tenancy references unit |
| Unit | property_id | Property | Many Units -> One Property (1:N) | Cascade | No | int PropertyId | Unique constraint on (PropertyId, RoomNumber) enforced in EF Core |
| Image | property_id | Property | Many Images -> One Property (1:N) | Cascade | Yes | int? PropertyId | Image may attach to property or unit; keep nullable |
| Image | unit_id | Unit | Many Images -> One Unit (1:N) | Cascade | Yes | int? UnitId | Image may attach to unit or property (nullable) |
| Payment | tenant_id | Tenant | Many Payments -> One Tenant (1:N) | Cascade | No | Guid TenantId | payments belong to tenant |
| Payment | unit_id | Unit | Many Payments -> One Unit (1:N) | Cascade | No | int UnitId | payments belong to a unit |
| Payment | tenancy_agreement_id | Tenancy_Agreement | Many Payments -> One Tenancy (1:N) | SetNull or Cascade (choose) | Yes | int? TenancyAgreementId | Optional until linked by webhook/verification; recommend SetNull to preserve payments if agreement deleted or use Cascade per business rules |
| PaymentSummary | tenancy_agreement_id | Tenancy_Agreement | One PaymentSummary -> One TenancyAgreement (1:1) | Cascade | No | int TenancyAgreementId | OneToOne relationship; PaymentSummary.tenancy_agreement is required |
| AuthToken | user_id | Tenant | One AuthToken -> One Tenant (1:1) | Cascade | No | Guid UserId | Stores issued token for logout/blacklist flows |
| Manager | user_id | Tenant | One Manager -> One Tenant (1:1) | Cascade | No | Guid UserId | Manager wraps a Tenant profile |

Notes and mapping guidance
- DeleteBehavior: Django `on_delete=models.CASCADE` generally matches EF Core `DeleteBehavior.Cascade`. For nullable relationships (like Payment.tenancy_agreement), consider `DeleteBehavior.SetNull` if you want to preserve payments after a Tenancy deletion; otherwise use `Cascade`.
- Nullable FKs: Map to nullable value types (e.g., `int?`) in C# for optional relationships.
- Unique constraints: `Unit` enforces uniqueness on (`PropertyId`, `RoomNumber`) — implement this as a unique index in EF Core using Fluent API.
- Identity mapping: `Tenant` is the project user model; in .NET prefer extending `IdentityUser<Guid>` or mapping Tenant as a separate domain user class and connecting to Identity via `TenantUser`.
- One-to-one: `PaymentSummary` <-> `TenancyAgreement` implement in EF Core with HasOne().WithOne().HasForeignKey<PaymentSummary>(ps => ps.TenancyAgreementId).

Recommended EF Core index/constraint summary
- Unique index: Units(PropertyId, RoomNumber)
- Unique index: Payments(Reference)
- Foreign key indexes: TenancyAgreement(TenantId), Payment(TenancyAgreementId), Payment(UnitId)

CSV export (same data, comma-separated)
From Model,FK Field,To Model,Multiplicity,DeleteBehavior,Nullable,C# type,Notes
Tenancy_Agreement,tenant_id,Tenant,1:N,Cascade,No,Guid TenantId,Tenant is required
Tenancy_Agreement,property_id,Property,1:N,Cascade,No,int PropertyId,tenancy references property
Tenancy_Agreement,unit_id,Unit,1:N,Cascade,No,int UnitId,tenancy references unit
Unit,property_id,Property,1:N,Cascade,No,int PropertyId,Unique constraint on (PropertyId, RoomNumber)
Image,property_id,Property,1:N,Cascade,Yes,int? PropertyId,Image may attach to property or unit
Image,unit_id,Unit,1:N,Cascade,Yes,int? UnitId,Image may attach to unit or property
Payment,tenant_id,Tenant,1:N,Cascade,No,Guid TenantId,payments belong to tenant
Payment,unit_id,Unit,1:N,Cascade,No,int UnitId,payments belong to a unit
Payment,tenancy_agreement_id,Tenancy_Agreement,1:N,SetNull,Yes,int? TenancyAgreementId,Optional until linked by webhook/verify
PaymentSummary,tenancy_agreement_id,Tenancy_Agreement,1:1,Cascade,No,int TenancyAgreementId,OneToOne required
AuthToken,user_id,Tenant,1:1,Cascade,No,Guid UserId,Stores issued token
Manager,user_id,Tenant,1:1,Cascade,No,Guid UserId,Manager wraps a Tenant profile

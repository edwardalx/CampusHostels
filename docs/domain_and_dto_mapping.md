# Domain Entities and DTO Mapping (per-model skeletons)

This document provides C#-style class skeletons and suggested DTOs for each Django model discovered. Use these as a starting point when implementing `Domain` and `Application` layers.

-- Common notes:
- For `Tenant` we recommend extending `IdentityUser<Guid>` (or using a separate Tenant aggregate linked to Identity) so authentication integrates with ASP.NET Identity easily.
- Amounts in the Django models are integer 'pesewas' — keep integer or use `long`. If you expect fractional currency use `decimal` with explicit scale.

-------------------------
Tenant (maps from `accounts.models.Tenant`)

C# Domain skeleton (if extending IdentityUser):
```csharp
public class Tenant : IdentityUser<Guid>
{
    public string? IdImageUrl { get; set; }
    public int? Age { get; set; }
    // Navigation
    public ICollection<TenancyAgreement> TenancyAgreements { get; set; }
    public ICollection<Payment> Payments { get; set; }
}
```

DTOs
- TenantCreateDto { string UserName; string Email; string Password; int? Age; }
- TenantReadDto { Guid Id; string UserName; string Email; string FirstName; string LastName; int? Age; }
- TenantUpdateDto { string? FirstName; string? LastName; int? Age; }

-------------------------
AuthToken

Domain skeleton
```csharp
public class AuthToken
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Tenant User { get; set; }
}
```

DTOs
- AuthTokenDto { Guid UserId; string Token; DateTimeOffset CreatedAt }

-------------------------
Property

Domain skeleton
```csharp
public class Property
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Location { get; set; }
    public string? ImageUrl { get; set; }
    public int? NoOfUnits { get; set; }
    public int? NoOfFloors { get; set; }
    public bool Availability { get; set; }

    public ICollection<Unit> Units { get; set; }
    public ICollection<Image> Images { get; set; }
}
```

DTOs
- PropertyDto (Id, Name, Location, ImageUrl, NoOfUnits, NoOfFloors, Availability)
- PropertyCreateDto (Name, Location, ImageUrl, NoOfUnits?, NoOfFloors?, Availability)

-------------------------
Unit

Domain skeleton
```csharp
public enum UnitType { Studio, OneBed /* '1bed' */ }

public class Unit
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public Property Property { get; set; }
    public int Floor { get; set; }
    public string? RoomNumber { get; set; }
    public string? ImageUrl { get; set; }
    public long? Cost { get; set; } // pesewas
    public int? MaxNoOfPeople { get; set; }
    public bool Availability { get; set; }
    public string UnitType { get; set; }
    public ICollection<Image> Images { get; set; }
    public ICollection<Payment> Payments { get; set; }
    public ICollection<TenancyAgreement> TenancyAgreements { get; set; }
}
```

DTOs
- UnitDto (Id, PropertyId, Floor, RoomNumber, ImageUrl, Cost, MaxNoOfPeople, Availability, UnitType)
- UnitCreateDto (PropertyId, Floor, RoomNumber, ImageUrl, Cost, MaxNoOfPeople, Availability, UnitType)

EF notes
- Add a unique index: modelBuilder.Entity<Unit>().HasIndex(u => new { u.PropertyId, u.RoomNumber }).IsUnique();

-------------------------
Image

Domain skeleton
```csharp
public class Image
{
    public int Id { get; set; }
    public int? PropertyId { get; set; }
    public Property? Property { get; set; }
    public int? UnitId { get; set; }
    public Unit? Unit { get; set; }
    public string Description { get; set; }
    public string PhotoUrl { get; set; }
}
```

DTOs
- ImageDto (Id, PropertyId?, UnitId?, Description, PhotoUrl)
- ImageCreateDto (PropertyId?, UnitId?, Description, PhotoUrl)

-------------------------
TenancyAgreement

Domain skeleton
```csharp
public class TenancyAgreement
{
    public int Id { get; set; }
    public DateOnly ContractStartDate { get; set; }
    public int ContractDurationMonths { get; set; }
    public DateOnly? ContractEndDate { get; set; }
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; }
    public int PropertyId { get; set; }
    public Property Property { get; set; }
    public int UnitId { get; set; }
    public Unit Unit { get; set; }
    public long? TotalAmountPaid { get; set; }
}
```

Domain logic note
- Compute ContractEndDate from ContractStartDate.AddMonths(ContractDurationMonths) either in service layer or as a property helper in domain model.

DTOs
- TenancyAgreementDto (Id, ContractStartDate, ContractDurationMonths, ContractEndDate, TenantId, PropertyId, UnitId, TotalAmountPaid)
- TenancyAgreementCreateDto (ContractStartDate, ContractDurationMonths, TenantId, PropertyId, UnitId)

-------------------------
Payment

Domain skeleton
```csharp
public enum PaymentProvider { Mtn, Vodafone, AirtelTigo }
public enum PaymentStatus { Pending, Success, Completed, Failed }

public class Payment
{
    public int Id { get; set; }
    public string Email { get; set; }
    public long Amount { get; set; }
    public string Currency { get; set; }
    public string Phone { get; set; }
    public string Provider { get; set; }
    public string Reference { get; set; }
    public string Status { get; set; }
    public string Channel { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public int UnitId { get; set; }
    public Unit Unit { get; set; }
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; }
    public int? TenancyAgreementId { get; set; }
    public TenancyAgreement? TenancyAgreement { get; set; }
}
```

DTOs
- PaymentCreateDto (Email, Amount, Currency, Phone, Provider, UnitId, TenantId, optional TenancyAgreementId)
- PaymentDto (Id, Email, Amount, Currency, Phone, Provider, Reference, Status, Channel, CreatedAt, UnitId, TenantId, TenancyAgreementId)

EF notes
- Add unique index on Reference: modelBuilder.Entity<Payment>().HasIndex(p => p.Reference).IsUnique();

-------------------------
PaymentSummary

Domain skeleton
```csharp
public class PaymentSummary
{
    public int Id { get; set; }
    public int TenancyAgreementId { get; set; }
    public TenancyAgreement TenancyAgreement { get; set; }
    public long TotalAmountPaid { get; set; }
    public long AmountLeft { get; set; }
    public DateOnly? LastPaymentDate { get; set; }
}
```

DTOs
- PaymentSummaryDto (TenancyAgreementId, TotalAmountPaid, AmountLeft, LastPaymentDate, Payments[])

-------------------------
AutoMapper & profiles

- Create profiles in `Application` project mapping Domain <-> DTOs. Example:
```csharp
CreateMap<Property, PropertyDto>();
CreateMap<PropertyCreateDto, Property>();
CreateMap<Unit, UnitDto>();
CreateMap<UnitCreateDto, Unit>();
// etc
```

-------------------------
EF Core configuration hints
- Configure one-to-one: modelBuilder.Entity<TenancyAgreement>().HasOne(t => t.PaymentSummary).WithOne(p => p.TenancyAgreement).HasForeignKey<PaymentSummary>(p => p.TenancyAgreementId);
- Configure required/optional FKs explicitly to control DeleteBehavior.
- Seed minimal lookup data if needed (unit types, providers) using `HasData` or a seeding service.

-------------------------
Next step
- Use these skeletons to implement Domain classes and DTOs. I can create the initial C# files with these skeletons in the repository if you want — say the word and I'll scaffold them under `src/Domain/Entities` and `src/Application/DTOs`.


Phase 4 — Detailed mapping (contract-first) — Domain -> DTO -> Service -> Controller
----------------------------------------------------------------------------------
This section is the concrete contract developers should implement in code. It expands the skeletons into exact interfaces, controller routes, DTO shapes, validation expectations and example method signatures.

Global conventions
- Controller methods return ActionResult<TDto> or IActionResult for non-DTO results.
- Use HTTP status codes: 200 OK, 201 Created (with Location header), 204 No Content (for successful deletes), 400 Bad Request (validation), 401/403 (auth), 404 Not Found, 409 Conflict (unique constraint violation).
- Use ProblemDetails response for errors.

Per-model contracts (quick reference)
====================================

Tenant / Accounts
-----------------
- DTOs:
    - TenantCreateDto { string UserName; string Email; string Password; string? FirstName; string? LastName; int? Age; }
    - TenantReadDto { Guid Id; string UserName; string Email; string? FirstName; string? LastName; int? Age; }
    - LoginDto { string UserName; string Password }
    - TokenResponseDto { string AccessToken; string RefreshToken; DateTime ExpiresAt; Guid UserId; string UserName }

- Service interface (Application/Interfaces/IAccountService.cs):
    - Task<TenantReadDto> RegisterAsync(TenantCreateDto dto);
    - Task<TokenResponseDto> LoginAsync(LoginDto dto);
    - Task RevokeRefreshTokenAsync(string refreshToken);
    - Task<TenantReadDto?> GetProfileAsync(Guid userId);

- Controller (API/Controllers/AccountsController.cs):
    - POST /api/auth/register -> validates TenantCreateDto, returns 201 Created + TenantReadDto
    - POST /api/auth/login -> validates LoginDto, returns 200 OK + TokenResponseDto
    - POST /api/auth/refresh -> accepts refresh token, returns new TokenResponseDto
    - POST /api/auth/revoke -> revokes a refresh token, returns 204 No Content
    - GET /api/tenant/profile -> returns TenantReadDto for authenticated user

- Validation rules:
    - Username must be digits only (Regex ^\d+$)
    - Password min length 8
    - Email required and valid

Property
--------
- DTOs:
    - PropertyCreateDto { string Name; string Location; string? ImageUrl; int? NoOfUnits; int? NoOfFloors; bool Availability }
    - PropertyDto { int Id; string Name; string Location; string? ImageUrl; int? NoOfUnits; int? NoOfFloors; bool Availability }

- Repository interface (IPropertyRepository):
    - Task<Property?> GetByIdAsync(int id);
    - Task<PagedResult<Property>> GetPagedAsync(PropertyQuery query);
    - Task AddAsync(Property property);
    - Task UpdateAsync(Property property);
    - Task DeleteAsync(int id);

- Service (IPropertyService):
    - Task<PropertyDto> CreateAsync(PropertyCreateDto dto);
    - Task<PropertyDto> UpdateAsync(int id, PropertyCreateDto dto);
    - Task<PropertyDto?> GetByIdAsync(int id);
    - Task<PagedResult<PropertyDto>> ListAsync(PropertyQuery query);

- Controller (PropertiesController):
    - GET /api/v1/property -> paged list
    - GET /api/v1/property/{id} -> detail
    - POST /api/v1/property -> create (auth: Manager/Admin)
    - PUT /api/v1/property/{id} -> update (auth)
    - DELETE /api/v1/property/{id} -> delete (auth)

- Validation: Name required, Location required, Name unique (service should check and throw 409 Conflict if duplicate).

Unit
----
- DTOs:
    - UnitCreateDto { int PropertyId; int Floor; string? RoomNumber; string? ImageUrl; long? Cost; int? MaxNoOfPeople; bool Availability; string UnitType }
    - UnitDto { int Id; int PropertyId; int Floor; string? RoomNumber; string? ImageUrl; long? Cost; int? MaxNoOfPeople; bool Availability; string UnitType }

- Repository (IUnitRepository):
    - Task<IEnumerable<Unit>> GetByPropertyIdAsync(int propertyId);
    - Task<Unit?> GetByIdAsync(int id);
    - Task AddAsync(Unit unit);
    - Task UpdateAsync(Unit unit);

- Service (IUnitService):
    - Task<IEnumerable<UnitDto>> GetByPropertyAsync(int propertyId);
    - Task<UnitDto> CreateAsync(UnitCreateDto dto);
    - Task<UnitDto> UpdateAsync(int id, UnitCreateDto dto);

- Controller (UnitsController):
    - GET /api/v1/property/{propertyId}/units -> 200 OK
    - GET /api/units/{id} -> 200 OK
    - POST /api/units -> create (auth)
    - PUT /api/units/{id} -> update (auth)

- Validation: PropertyId must exist; if RoomNumber provided uniqueness checked within property.

Image
-----
- DTOs:
    - ImageCreateDto { int? PropertyId; int? UnitId; string Description; string PhotoUrl }
    - ImageDto { int Id; int? PropertyId; int? UnitId; string Description; string PhotoUrl }

- Controller (ImagesController):
    - POST /api/images -> create
    - GET /api/images/{id} -> read
    - GET /api/properties/{propertyId}/images -> list

- Validation: require either PropertyId or UnitId (or both depending on design), PhotoUrl or multipart file upload.

TenancyAgreement
----------------
- DTOs:
    - TenancyAgreementCreateDto { DateOnly ContractStartDate; int ContractDurationMonths; Guid TenantId; int PropertyId; int UnitId }
    - TenancyAgreementDto { int Id; DateOnly ContractStartDate; DateOnly? ContractEndDate; int ContractDurationMonths; Guid TenantId; int PropertyId; int UnitId; long? TotalAmountPaid }

- Service (ITenancyService):
    - Task<TenancyAgreementDto> CreateAsync(TenancyAgreementCreateDto dto);
    - Task<TenancyAgreementDto?> GetByIdAsync(int id);
    - Task<IEnumerable<TenancyAgreementDto>> GetByTenantAsync(Guid tenantId);

- Controller (TenanciesController):
    - POST /api/tenancy -> create
    - GET /api/tenancy/{id}
    - GET /api/tenancy/profile -> tenant's tenancies (auth required)

- Validation: Unit availability check, ContractDurationMonths > 0.

Payment
-------
- DTOs:
    - PaymentCreateDto { string Email; long Amount; string Currency; string Phone; string Provider; int UnitId; Guid TenantId; int? TenancyAgreementId }
    - PaymentDto { int Id; string Email; long Amount; string Currency; string Phone; string Provider; string Reference; string Status; string Channel; DateTimeOffset CreatedAt; int UnitId; Guid TenantId; int? TenancyAgreementId }

- Repository (IPaymentRepository):
    - Task<Payment?> GetByReferenceAsync(string reference);
    - Task<IEnumerable<Payment>> GetByTenantAsync(Guid tenantId);
    - Task AddAsync(Payment payment);
    - Task UpdateAsync(Payment payment);

- Service (IPaymentService):
    - Task<InitializePaymentResultDto> InitializeAsync(PaymentCreateDto dto); // creates pending Payment and calls gateway
    - Task<PaymentDto> VerifyAsync(string reference); // verifies with gateway and updates DB
    - Task HandleWebhookAsync(string payload, IDictionary<string,string> headers); // idempotent processing

- Controller (PaymentsController):
    - POST /api/payments/initialize -> 200 OK { gateway data }
    - POST /api/payments/webhook -> 200 OK (no auth) - verifies HMAC
    - GET /api/payments/history -> 200 OK (auth) list of PaymentSummaryDto
    - GET /api/payments/verify/{reference} -> 200 OK

- Validation: Amount > 0; Provider in allowed enum; UnitId exists.

PaymentSummary
--------------
- DTO: PaymentSummaryDto { int TenancyAgreementId; string PropertyName; long TotalAmountPaid; long AmountLeft; DateOnly? LastPaymentDate; IEnumerable<PaymentDto> Payments }

- Service (IPaymentSummaryService):
    - Task<IEnumerable<PaymentSummaryDto>> GetByTenantAsync(Guid tenantId);
    - Task RecalculateAsync(int tenancyAgreementId);

- Controller:
    - GET /api/payment-summary/profile -> 200 OK

Cross-cutting: AutoMapper & Validation
-------------------------------------
- AutoMapper:
    - Map CreateDto -> Domain (reverse mapping not necessary for Create)
    - Map Domain -> ReadDto for reads
    - Use ForMember to map nested props (e.g., PaymentSummaryDto.PropertyName <- TenancyAgreement.Property.Name)

- FluentValidation:
    - Create validators for each CreateDto and UpdateDto.
    - Where uniqueness is required (Property.Name), use an async validator that queries repository to check existence and reports a 409 Conflict if violated.

Error handling & logging
------------------------
- Centralize error handling with ExceptionMiddleware that converts known exceptions to ProblemDetails with appropriate status codes. Examples:
    - ValidationException -> 400
    - NotFoundException -> 404
    - ConflictException -> 409
    - UnauthorizedAccessException -> 401

- Log at Information level for business events (payment initialized, tenancy created) and Error for unexpected exceptions with full stack trace.

Testing guidance (concrete)
--------------------------
- Unit tests: mock repositories and gateways. Test validation rules and service flows. Example test cases:
    - PaymentService.Initialize persists Payment with Pending status and calls gateway.
    - PaymentService.Verify updates Payment and sets Unit.Availability false when successful.

- Integration tests: run API controllers with WebApplicationFactory and an in-memory or Testcontainers Postgres DB. Test full webhook->verify flow, tenancy creation, and unique constraint violations.

Deliverables & acceptance
------------------------
- Phase 4 deliverable: this documentation is the contract; implementing code should match the DTOs, service interfaces and controller routes above. After implementation, run unit and integration tests described in the testing guidance.

If you want me to scaffold the minimal C# files (Domain entities, DTOs, interfaces, AppDbContext) now so the team can start implementing, I can create a compileable starting point — say so and I'll scaffold under `src/` with the project references and minimal Program.cs wiring.


Decision: Use decimal for money fields

Summary

We converted money-related fields to use decimal to represent currency values with fractional precision rather than integer smallest-units. This affects domain entities, DTOs, validators, services, and tests.

Files changed

- Domain:
  - `Domain/Entities/Payment.cs` (Amount: int -> decimal)
  - `Domain/Entities/Unit.cs` (Cost: int? -> decimal?)
  - `Domain/Entities/PaymentSummary.cs` (TotalAmountPaid, AmountLeft: int -> decimal)
  - `Domain/Entities/TenancyAgreement.cs` (TotalAmountPaid: int? -> decimal?)

- Application DTOs:
  - `Application/DTOs/UnitDto.cs` (Cost: int? -> decimal?)
  - `Application/DTOs/UnitCreateDto.cs` (Cost: int? -> decimal?)

- Services:
  - `Application/Services/PaymentService.cs` (removed casts, use decimal math)

- Validators:
  - `Application/Validators/UnitCreateDtoValidator.cs` (compare with 0m)

- Tests:
  - `tests/CampusHostels.Infrastructure.Tests/UnitServiceTests.cs` (use 500m/600m expectations)
  - `tests/CampusHostels.Infrastructure.Tests/PaymentServiceTests.cs` (expect decimal amounts and totals)

Rationale

- decimal is the recommended .NET type for monetary values because it provides exact decimal representation and avoids rounding errors present with binary floating point types.
- Using decimal makes it explicit that amounts may include fractional currency units (e.g., cents/pesewas) and preserves accuracy for sums/aggregations.

Notes about migrations and DB

- This change alters entity CLR types. Existing EF Core migrations (under `Infrastructure/Data/Migrations`) still define integer columns for these fields. After merging this change to a long-lived branch, you should:
  1. Add a new EF Core migration that updates the column types to a suitable SQL type (e.g., `decimal(18,2)` for relational DBs). Example:
     dotnet ef migrations add ConvertMoneyToDecimal
  2. Review the generated SQL in the migration for the target provider (SQLite/Postgres) and adjust if necessary. SQLite has limited decimal support; it stores decimals as NUMERIC/REAL depending on provider.
  3. Apply the migration to the development DB (or create a safe data-migration path for production).

Testing notes / How tests represent money

- Unit/integration tests should use decimal literals (e.g., `500m`) when asserting or creating money values.
- The project's existing unit tests under `tests/**` have been updated to use `500m`/`600m` where appropriate. The in-memory EF provider tolerates CLR type changes without migrations, so tests run locally after the change.

Commands

Run the unit tests (Infrastructure tests used in this work):

```powershell
# from workspace root
dotnet test "backend-api\tests\CampusHostels.Infrastructure.Tests\CampusHostels.Infrastructure.Tests.csproj" -v minimal
```

Follow-up tasks

- Create and apply an EF Core migration to persist the CLR type changes to the DB schema (important before running with SQLite or Postgres in CI/production).
- Consider adding a small data migration script if you already have integer amounts stored in production DBs (convert from smallest unit integers to decimal with appropriate division if you change representation semantics).

If you want I can also create the EF migration locally (it will modify the migrations folder) and run `dotnet ef database update` against the dev SQLite (I will back up the current DB file first). Let me know if you want me to proceed with that and whether to keep integer columns as "smallest unit" or migrate to decimal column semantics (`decimal(18,2)`).

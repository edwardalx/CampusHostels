# CampusHostels
This is an app to manage hotels in the Offinso Municipality of Ghana


What's left (open / not-started items)

Implement Application services & business logic
Implement services: PropertyService, UnitService, TenancyService, PaymentService, AccountService.
Move domain model logic (e.g., compute contract end date, payment summaries) into services.
Acceptance: service unit tests for core business rules pass.
Authentication (Identity + JWT)
Migrate to ASP.NET Identity: extend IdentityUser (TenantUser), wire EF stores, replace temporary JWT hashing with Identity-based flows, implement register/login/refresh/revoke.
Acceptance: integration tests cover register/login + refresh + revoke flows.
Payment gateway & webhook handling
Implement IPaymentGateway and Paystack (or other) adapter, secure webhook handler (HMAC verification, idempotency).
Acceptance: integration tests (mocked gateway) verify flows and PaymentSummary updates.
Data migration tool & seeders
Small console tool to import SQLite → Postgres preserving FKs/IDs; provide dry-run and instructions.
Tests, CI/CD, Docker & deploy
Full test coverage, GH Actions pipeline, test Postgres service in CI, docker-compose for local Postgres + API.

$env:ASPNETCORE_ENVIRONMENT='Production'
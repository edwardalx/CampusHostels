# Phase 5 — Implementation Plan & Tech Tasks

Purpose
-------
This document is the execution blueprint to convert the Django REST API into a .NET Web API using the layered architecture (/Domain, /Application, /Infrastructure, /API). It contains sprint-by-sprint tasks, concrete developer tasks, CI/CD and deployment guidance, migration steps (SQLite -> Postgres), testing & verification checklists, rollbacks and operational notes. This exercise is for information-gathering and planning only; no code changes are made here.

High-level approach and constraints
- Keep dev environment on SQLite for fast iteration; production uses PostgreSQL (Npgsql).
- Follow the contract defined in Phase 4: DTOs, services and controller routes.
- Prioritize safety for payment/webhook flows: idempotent handling, locking, and strong tests.

Team & roles (example)
- 1 Backend Lead (Architect) — overall design, reviews, critical flows (auth, payments, migrations).
- 2 Backend Engineers — implement Domain, Infrastructure, Application and Controllers.
- 1 DevOps Engineer — CI, Docker, Postgres, deployment pipelines.
- 1 QA Engineer — integration and end-to-end tests.

Estimated timeline (rough, medium complexity)
- Sprint 0 (setup): 2 days
- Sprint 1 (Domain + EF): 4 days
- Sprint 2 (DTOs, Repos, Mappings): 3 days
- Sprint 3 (Services + Controllers): 5 days
- Sprint 4 (Auth + Payments + Webhook): 4 days
- Sprint 5 (Tests, CI/CD, Docs): 3 days
- Buffer & bug-fix: 3 days

Total: ~24 working days (approx. 4–6 weeks depending on team size and parallelism)

Sprint breakdown — concrete tasks
--------------------------------
Sprint 0 — Scaffolding & infra (2 days)
- Create solution and projects (Domain, Application, Infrastructure, API).
- Add dependencies: EFCore, Npgsql, AutoMapper, Serilog, Swashbuckle, FluentValidation, xUnit.
- Commit scaffold, add README with run instructions for dev (SQLite).
- Add DesignTimeDbContextFactory and initial AppDbContext placeholder.

Deliverables
- Solution scaffold committed, `dotnet build` passes.

Sprint 1 — Domain & EF mapping (4 days)
- Implement Domain entities for Tenant, Property, Unit, Image, TenancyAgreement, Payment, PaymentSummary.
- Implement Infrastructure `AppDbContext` and `Configurations/*` classes with Fluent API, unique indexes and FK delete behaviors.
- Create initial EF Core migrations for development (SQLite) and verify schema.
- Add `DesignTimeDbContextFactory` and `IEntityTypeConfiguration` classes.

Deliverables
- Domain models + AppDbContext + migrations.

Sprint 2 — DTOs, Mapping & Repositories (3 days)
- Implement DTO classes in Application/DTOs and AutoMapper profiles.
- Implement repository interfaces and EF implementations (IPropertyRepository, IUnitRepository, IPaymentRepository, ITenancyRepository, ITenantRepository).
- Add basic unit tests for repository CRUD operations using InMemory or SQLite in-memory.

Deliverables
- DTOs + AutoMapper + Repositories + basic unit tests.

Sprint 3 — Services & Controllers (5 days)
- Implement Application services: PropertyService, UnitService, TenancyService, PaymentService, AccountService.
- Implement Controllers mirroring Django routes (PropertiesController, UnitsController, PaymentsController, AccountsController, TenanciesController).
- Implement FluentValidation validators.
- Add integration smoke tests for key endpoints using WebApplicationFactory (in-memory host).

Deliverables
- Services + Controllers + integration smoke tests.

Sprint 4 — Authentication & Payment Gateway (4 days)
- Integrate ASP.NET Identity (TenantUser or extended IdentityUser<Guid>). Implement TokenService to issue JWT access & refresh tokens.
- Implement AuthToken table for refresh token revocation; implement logout/revoke endpoint.
- Implement IPaymentGateway with PaystackGateway adapter: Initialize, Verify, Webhook handlers (HMAC verification, idempotency logic).
- Add end-to-end tests for initialize/verify flows (mock external Paystack responses).

Deliverables
- Identity + Jwt token flows, Paystack adapter + webhook handler, tests.

Sprint 5 — Tests, CI/CD & Deployment (3 days)
- Add unit test coverage for services (xUnit + Moq) — important business rules: contract end date, amount left.
- Integration tests using Testcontainers Postgres or GitHub Actions Postgres service.
- Add GitHub Actions: build, test, run EF migrations against test DB, run integration tests.
- Dockerize API and add docker-compose for local Postgres + API.

Deliverables
- CI pipeline, Docker images, integration tests.

Buffer & polish (3 days)
- Fix issues discovered in tests, add Swagger docs, add health checks, finalize docs and run manual QA scenarios, prepare migration tooling for production.

Detailed tech tasks (developer-level)
-----------------------------------
The following list is per-repo/per-file work items for implementers.

Domain
- Create C# classes for all entities in `Domain/Entities` with properties and navigation properties.
- Add value objects/enums: UnitType, PaymentProvider, PaymentStatus.

Application
- Create DTOs (`Application/DTOs`) for Create/Read/Update operations.
- Create mapping profiles in `Application/Mapping/MappingProfile.cs` and register in API.
- Create service interfaces in `Application/Interfaces` and stub implementations in `Application/Services`.

Infrastructure
- Create `Infrastructure/Data/AppDbContext.cs` with DbSet<T> for all entities.
- Implement `Configurations/*Configuration.cs` for each entity with Fluent API specifics (unique index, cascade rules, column types).
- Implement repository classes mapping to Application interfaces.
- Implement `Infrastructure/PaymentGateway/PaystackGateway.cs` and `Infrastructure/PaymentGateway/IPaymentGateway.cs` (mockable interface).

API
- Add controllers for each aggregate, using constructor injection for services.
- Add authentication endpoints and token issuance (AuthController).
- Add webhook endpoint for payments and ensure it doesn't require auth and validates HMAC.

DevOps & CI/CD tasks
---------------------
- Create Dockerfile for API and docker-compose for local Postgres.
- Add GitHub Actions pipeline with stages: restore, build, test, integration (Postgres service), publish image (optional).
- Configure environment secrets in GitHub (PAYSTACK_SECRET_KEY, JWT_SECRET, DB credentials).
- Add migration step in deployment: run `dotnet ef database update` (or run migrations in startup with caution).

Data migration & import (SQLite -> Postgres)
-----------------------------------------
Option A — Data Import Tool (recommended)
1. Create console app `Infrastructure.Tools.DataImporter`.
2. Add two DbContexts: one for SQLite source (configured with `UseSqlite("Data Source=rent_in/db.sqlite3")`) and one for target Postgres (UseNpgsql).
3. Read data in safe order to preserve FKs: Tenants -> Properties -> Units -> TenancyAgreements -> Payments -> PaymentSummaries.
4. Insert into Postgres inside transactions, log progress, and update progress checkpoint.
5. After import, run `SELECT setval('"Table_Id_seq"', (SELECT MAX(id) FROM "Table"));` for sequences.

Option B — Export/Import CSV
- Export tables to CSV, create Postgres schema with EF migrations, and import via `COPY` operations. Requires careful mapping of IDs and sequences.

Verification & acceptance checklist (pre-production)
--------------------------------------------------
- Build passes: `dotnet build` (all projects)
- Unit tests pass: `dotnet test` (unit projects)
- Integration tests pass against Postgres test service
- EF migrations apply cleanly to a staging Postgres instance and schema matches expectations (indexes, FK constraints)
- Manual test scenarios:
  - Register/login flow (issue access & refresh tokens), refresh token rotation, revoke token flow
  - Property create/list/update/delete with role-based auth
  - Create TenancyAgreement and verify ContractEndDate computation
  - Initialize payment -> verify with mocked Paystack -> webhook processing -> PaymentSummary updated -> Unit availability toggled
  - Idempotency: re-send webhook payload and confirm no double-processing
- Observability: Serilog writes to console/file (and optionally Seq), health check returns healthy, Swagger available in staging

Rollout & rollback plan
-----------------------
- Blue/green or rolling deployment recommended. Run migrations on a readonly maintenance window if schema changes are destructive.
- To rollback:
  - If code deploy fails: revert to previous Docker image and restart service.
  - If migration causes issues: have DB backups and ability to restore; avoid destructive data migrations where possible.

Monitoring & ops
----------------
- Add logs for failed webhooks and failed payment processing.
- Monitor number of pending payments and webhook failure rate.
- Add alerts for database connectivity errors and high error rates.

Risks & mitigations
-------------------
- Risk: Data mismatch when importing from SQLite (types, lengths). Mitigation: data import tool with validation and a staging import run.
- Risk: Double-processing webhooks. Mitigation: idempotency checks (unique reference, row locking) and careful transaction handling.
- Risk: Auth mismatch between Django and Identity models. Mitigation: map user fields explicitly and test auth flows thoroughly.

Deliverables for this exercise
-----------------------------
- `docs/implementation_plan.md` (this file) — Phase 5 plan and tasks.
- Existing docs: `implementation.txt`, `docs/domain_and_dto_mapping.md`, `docs/model_relationships.md`, `docs/relationship_analysis.md`, `docs/scaffold_guidelines.md` — all together provide a complete migration specification.

Next steps (after review)
------------------------
1. Approve this plan or request edits; specify any constraints (deadlines, team size, preferred cloud infra).
2. On approval I will either scaffold minimal compileable C# projects (Domain/App/Infrastructure/API) or produce a prioritized ticket list (Jira/GitHub issues) with the exact file-level tasks and estimates.

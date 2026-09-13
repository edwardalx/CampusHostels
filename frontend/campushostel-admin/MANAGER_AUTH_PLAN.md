# Manager Authentication & Permissions — Implementation Plan

This document defines the plan for introducing "Manager" and "Super Manager" roles into CampusHostels, including how paid access is granted, revoked, and enforced. It builds on [ADMIN_ARCHITECTURE.md](../../ADMIN_ARCHITECTURE.md).

**Status: Phase A (decoupled Manager auth + Admin login) is implemented. The Phase B grant endpoint (`POST /api/managers`, Super-Manager-only) is also implemented, ahead of schedule — subscription fields on `Manager` are still pending. A password policy layer (forced first-login change + 90-day rotation for Standard managers) is also implemented.** See "Implementation Phases" below.

---

## Current State

- `Domain/Entities/Users.cs` (Tenant-facing accounts) still has a free-text `Role` string field, defaulting to `"Tenant"`, and `RegisterDto.Role` is still client-supplied with no server-side restriction. This remains latent debt in the Tenant/User system, but **it is no longer a risk to Manager access** — see "Decisions" below for why.
- **Managers are a fully separate entity/table (`Domain/Entities/Manager.cs`, `Managers` table)**, with no foreign key to `User` at all. Manager accounts have their own login endpoint, own password hash, and own JWT issuance (`ManagerTokenService`), completely decoupled from the Tenant/User system.
- `ManagersController` exposes `POST /api/managers/login` (public), `GET /api/managers/me` (`RequireManager`), `POST /api/managers` (`RequireSuperManager`) to create new manager accounts, and `POST /api/managers/change-password` (`RequireManager`). There is deliberately no public `register` endpoint — new managers can only be created by an existing Super Manager (or, in future, via a payment webhook in Phase C). Standard managers cannot create other managers (verified: 403).
- **Password policy**: `Manager.MustChangePassword` defaults to `true` for every manager (seeded, grant-created, or backfilled by migration) — surfaced in the login response and `/me`, enforced client-side in `campushostel-admin` (redirects to `/change-password`, `ProtectedRoute` blocks the dashboard until it's cleared). `Manager.LastPasswordChangeAt` is set on a successful `change-password` call. A daily Hangfire job (`ManagerPasswordExpiryJob`, mirrors `TenancyJob`) flips `MustChangePassword` back to `true` for **Standard** managers whose password is more than 90 days old — Super Managers are exempt from the recurring rotation (only the one-time first-login change applies to them).
- The Payment domain is mature and already in production use: `Payment`, `PaymentSummary`, `PaymentService`, `PaystackService`, `PaymentsController`. Manager access should hook into this in Phase C rather than building a parallel payment system.
- `backend-admin` (Django) mirrors the `Users` table directly via an unmanaged model and can write to that table's `Role` column directly, bypassing any guardrail built in the .NET API. This is a known risk for Tenant/User data, already flagged in `ADMIN_ARCHITECTURE.md`. It does **not** currently apply to Manager data — Django has no mirror model for the new `Managers` table.

---

## Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Manager data shape | **Fully separate `Manager` entity/table — no FK to `User`, no shared auth** | Explicit requirement: Tenant and Manager accounts must never be the same underlying record. A Tenant self-registering with a client-supplied `Role: "Manager"` string (a pre-existing, unfixed hole in `AccountService.RegisterAsync`) still cannot gain Manager access, because Manager-gated endpoints check a `scope=manager` JWT claim that only `ManagerTokenService` ever issues — a Tenant/User token can never carry it. |
| Manager auth flow | Own controller, own login/JWT issuance (`ManagersController`, `ManagerService`, `ManagerTokenService`) | Keeps the two account systems architecturally independent, not just data-independent. Mirrors `ADMIN_ARCHITECTURE.md`'s "separate admin API area" principle. |
| Paid access model | Recurring subscription with expiry | Access must lapse automatically if payment isn't renewed; requires expiry tracking and a renewal path, not a single permanent grant. **Not yet implemented** — see Phase C. |
| Source of truth for active access (once subscriptions exist) | A `SubscriptionStatus` field on `Manager`, not the JWT claim alone | JWT tokens live for hours; a subscription could lapse mid-token-lifetime. Authorization for manager-gated actions should check live DB state, not just a cached claim. **Not yet implemented** — see Phase C. |
| Super Manager provisioning | Manual seed/grant only, never payment-granted | Highest privilege tier; must not be reachable through any public payment or registration flow. |

---

## Data Model

### `Manager` entity (implemented — `Domain/Entities/Manager.cs`)

| Field | Type | Notes |
|---|---|---|
| `Id` | int | PK |
| `ManagerId` | Guid | External-facing identifier, carried in the JWT (`managerId` claim) |
| `FirstName` / `LastName` | string | |
| `Email` / `PhoneNumber` | string | Unique indexes |
| `Username` | string | Unique. **Login credential** — `Email`/`PhoneNumber` are stored contact info only, not used for login. |
| `PasswordHash` | string | SHA-256 via `AccountService.HashPassword` (reused, not duplicated) — see "Open Risks" |
| `Tier` | enum: `Standard`, `Super` | Carried in the JWT (`managerTier` claim). No tier-specific behaviour yet beyond the (currently unused) `RequireSuperManager` policy. |
| `RefreshToken` / `RefreshTokenExpiryTime` | string? / DateTime? | Present on the entity, not yet wired into a refresh flow |
| `FailedLoginAttempts` / `IsActive` | int / bool | Same lockout-after-5-attempts behaviour as `AccountService.LoginAsync`, ported to `ManagerService.LoginAsync` |
| `CreatedAt` / `UpdatedAt` / `LastLoginAt` | DateTime | |

**Not yet added** (Phase C, when payment-gating lands): `SubscriptionStatus`, `SubscriptionStartedAt`, `SubscriptionExpiresAt`, `LastPaymentId`.

### `User` entity

Unchanged. No plan to touch it for Manager purposes — the two systems are intentionally independent.

---

## Authorization Mechanism (implemented)

- `Program.cs` registers two policies:
  - `RequireManager` → `policy.RequireClaim("scope", "manager")`
  - `RequireSuperManager` → `policy.RequireClaim("managerTier", "Super")` (not yet used on any endpoint)
- `ManagerTokenService` issues `scope=manager` (the actual authorization anchor), plus `ClaimTypes.Role=Manager`, `managerId`, and `managerTier` for readability/future use.
- Using a dedicated `scope` claim rather than `ClaimTypes.Role` was deliberate: both Tenant and Manager JWTs are validated by the same JWT Bearer scheme/signing key, so if `RequireManager` checked the generic role claim instead, a Tenant who self-registered with `Role: "Manager"` (the pre-existing, unfixed hole in `AccountService`) would incorrectly pass. The `scope` claim can't be produced by anything except `ManagerTokenService`.
- **Still deferred, unchanged from the original plan:** locking down `PropertiesController`/`UnitsController` write endpoints behind `RequireManager`. Belongs to the future "Property and room overview" work, not to Manager auth itself.

---

## Access Flow

1. **Manager login** (implemented) — `POST /api/managers/login` with **username** + password (not email/phone). Same lockout/IsActive checks as Tenant login, against the `Managers` table.
2. **Session check** (implemented) — `GET /api/managers/me` (`RequireManager`), used by the admin SPA to validate a stored token on load.
3. **Becoming a Manager**:
   - **Implemented:** `POST /api/managers` (`RequireSuperManager`) — a Super Manager creates a new manager directly (`ManagerCreateDto`: name, email, phone, password, optional `Tier`, defaults to `Standard`). Duplicate email/phone returns 409.
   - **Phase C, not yet implemented:** a confirmed Paystack webhook payment creates/renews a `Manager` row and sets `SubscriptionStatus = Active` instead.
4. **Renewal / Expiry** (Phase C, not yet implemented): a Hangfire job (following the existing `TenancyJob` pattern) flips lapsed subscriptions to `Expired`.
5. **Super Manager provisioning**: the first Super Manager is a **dev-only seed row** (`ApplicationDbContext`, `Manager` `HasData`) — username `superadmin`, password `SuperManager123!`. **Rotate or remove this before any non-local deployment.** Subsequent Super Managers can already be created via `POST /api/managers` with `"Tier": "Super"` by an existing Super Manager — no further work needed for this part of Phase B.

---

## Implementation Phases

### Phase A — Decoupled Manager auth + Admin login — **Done**
- `Manager` entity, `ManagerTier` enum, `Managers` table (own migration, own indexes, no FK to `User`).
- `ManagerService` / `ManagerTokenService` / `ManagersController` (`login`, `me`), fully independent of `AccountService`/`TokenService`/`AccountsController`.
- `RequireManager` / `RequireSuperManager` authorization policies, anchored on a `scope`/`managerTier` claim that only Manager tokens carry.
- Dev-only bootstrap Super Manager seed row.
- `campushostel-admin`: login page, `AuthContext` (session restore via `/me`), `ProtectedRoute`, logout, Vite dev proxy to the API on a dedicated port (5174) with matching CORS entry.

### Phase B — Manual grant path + subscription fields — **Grant endpoint done, subscription fields pending**
- ~~Add a "grant manager" endpoint restricted to `RequireSuperManager`~~ — done (`POST /api/managers`).
- Remaining: add `SubscriptionStatus`, `SubscriptionStartedAt`, `SubscriptionExpiresAt`, `LastPaymentId` to `Manager` (needed once Phase C payment-gating lands; managers created via the grant endpoint today have no subscription concept yet, so they simply don't expire).

### Phase C — Payment-gated access
- Tag manager-plan payments distinctly in the existing Paystack flow.
- On confirmed webhook payment, server-side service creates/renews the `Manager` record and sets `SubscriptionStatus = Active`.
- Add the Hangfire expiry job to flip lapsed subscriptions to `Expired`.
- Switch `RequireManager` (or a new policy) to check live `SubscriptionStatus` rather than just the JWT claim, so a lapsed subscription revokes access immediately rather than waiting for token expiry.

### Phase D — Admin UI
- Surface roles, subscription status, and expiry in the admin dashboard's "Settings and access control" module (per `ADMIN_ARCHITECTURE.md`), so a Super Manager can view/revoke access without touching the database directly.

---

## Open Risks

- The dev-only bootstrap Super Manager credential (`superadmin@campushostels.dev` / `SuperManager123!`) is committed as EF seed data. Rotate or remove before any non-local deployment.
- Password hashing (`AccountService.HashPassword`, reused by `ManagerService`) is SHA-256, not a proper password hasher (no salt, no work factor). Not blocking, but worth revisiting given Manager accounts guard higher-value actions.
- `PropertiesController`/`UnitsController` write endpoints remain unauthenticated — unrelated to this decoupling work, but still an open gap to close when property/unit management work begins.
- The pre-existing `RegisterDto.Role` client-control hole in `AccountService.RegisterAsync` is unfixed. It no longer threatens Manager access (see "Decisions" above), but it's still a real gap in the Tenant/User system worth closing on its own merits.

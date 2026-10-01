# CampusHostels – Security and Code-Quality Audit

Date of audit: 2026-10-01
Scope: `backend-api/CampusHostels.API`, `image-server/`, `frontend/campushostel-admin` (TypeScript), `frontend/campushostel-fe` (JSX), `nginx/`, `docker-compose.yml`, `Jenkinsfile*`, `scripts/`, plus a brief look at `backend-admin/` (Django) where it touches deployment.

## How to read this report

- Method: static, read-only review of tracked files (`git ls-files`), plus targeted `grep`. The app was not run and no database was touched. Nothing here has been exploited; "Confirmed" means the code or configuration was read and the behaviour follows directly from it.
- Confidence levels: **Confirmed** (verified in code/config), **Likely** (strongly implied, one assumption), **Needs verification** (depends on deployment state we cannot see, e.g. the untracked `.env`).
- **Secrets are redacted.** Where a credential is committed, this report names the file, line and kind of secret and shows `[REDACTED]`. Treat every credential named below as compromised and rotate it (see V-01).
- **Customer-app line numbers (`frontend/campushostel-fe`) refer to commit HEAD `68f34db`** (read with `git show HEAD:<path>` / `git grep ... HEAD`), because the working tree is being refactored on branch `feature/fe-mobile-modernisation`. All other line numbers are from the working tree, which matched HEAD for those paths at audit time (clean `git status`).
- Data protection: the system processes names, phone numbers, email addresses and payment records. UK GDPR is assumed relevant per company policy; note the customers appear to be in Ghana/Nigeria (GHS/NGN currencies), so local data-protection law may also apply. Legal/DPO review is recommended (see "Data protection notes").

---

## Part 1 – Vulnerabilities

### Summary table

| ID | Severity | Confidence | Title | Primary location |
|----|----------|-----------|-------|------------------|
| V-01 | Critical | Confirmed | Credentials and signing keys committed to git (and in history) | `appsettings*.json`, `image-server/appsettings*.json` |
| V-02 | Critical | Confirmed (repo) / Needs verification (prod) | Placeholder JWT signing key allows forged manager tokens | `Program.cs:149-166`, `ManagerTokenService.cs` |
| V-03 | Critical | Confirmed (seed) / Needs verification (prod state) | Seeded Super Manager with documented credential, applied to production by migrations | `ApplicationDbContext.cs:46-63` |
| V-04 | High | Confirmed | Unauthenticated access to payments, tenancies and customer PII (IDOR chain) | `PaymentsController.cs`, `TenanciesController.cs`, `AccountsController.cs` |
| V-05 | High | Confirmed | Any signed-in user can edit another user's profile (leads to account takeover) | `AccountsController.cs:141-150` |
| V-06 | High | Confirmed | Password-reset link poisoning via client-supplied `ResetUrlBase` | `PasswordResetService.cs:85-93` |
| V-07 | High | Confirmed | `verify-reset` is a password oracle that bypasses lockout | `PasswordResetService.cs:118-131` |
| V-08 | High | Confirmed | Unsalted SHA-256 password hashing, non-constant-time compare | `AccountService.cs:237-252` |
| V-09 | High | Confirmed | Google sign-in accepts any Google access token (no audience check) | `AccountService.cs:163-235` |
| V-10 | High | Confirmed (config) / Needs verification (reachability) | Portainer with Docker socket routed to the public internet | `campushostels.conf:103-119`, `docker-compose.yml:146-159` |
| V-11 | Medium | Confirmed | Jenkins over plain HTTP; DB, MSSQL, API and Portainer ports published on the host | `jenkins.conf`, `docker-compose.yml` |
| V-12 | Medium | Confirmed | No rate limiting; permanent manager lockout; account enumeration | multiple |
| V-13 | Medium | Confirmed | Mass assignment on registration (`Role`, `IsActive`) | `LoginDto.cs:19-23`, `AccountService.cs:54-56` |
| V-14 | Medium | Confirmed / Likely | Payment integrity: client-set amount and callback, no amount check, double-credit race | `PaymentService.cs`, `PaymentsController.cs` |
| V-15 | Medium | Confirmed | Authorisation scoping gaps (unit creation, manager tokens, ratings) | `UnitsController.cs:44-70` and others |
| V-16 | Medium | Confirmed | Reset tokens and PII written to logs and the database | `PasswordResetService.cs:92`, `WhapiCloudService .cs:74-83` |
| V-17 | Medium | Confirmed | JWTs in `localStorage`, 6-hour hard-coded lifetime, no revocation, no CSP | FE/admin auth services |
| V-18 | Medium | Confirmed | No HSTS or security headers; HTTPS redirect only in Development | `nginx/`, `Program.cs:316-324` |
| V-19 | Medium | Confirmed | Docker/CI hygiene (root containers, shared `.env`, `StrictHostKeyChecking=no`, no `.dockerignore`) | Dockerfiles, `Jenkinsfile*` |
| V-20 | Medium | Confirmed | Image upload validation is extension-only; no quota; shared JWT key | `image-server/Program.cs:87-158` |
| V-21 | Medium | Needs verification | SQLite database file tracked in git | `backend-api/CampusHostels.API/campushostels.db` |
| V-22 | Low | Confirmed | Exception detail leakage, 500 on missing unit, dead `/error` handler | `ExceptionHandlingMiddleware.cs`, `UnitsController.cs:36` |
| V-23 | Low | Confirmed | Sloppy CORS allow-list | `Program.cs:232-245` |
| V-24 | Low | Needs verification | Hangfire dashboard mapped without explicit authorisation | `Program.cs:330` |
| V-25 | Low | Confirmed | Webhook compare not constant-time; unencoded Paystack reference; `int` overflow | `PaystackService.cs` |
| V-26 | Low | Confirmed | HTML injection into emails | `AccountsController.cs:64-68`, `PasswordResetService.cs:90-93` |
| V-27 | Low | Likely / Needs verification | Dependency and lock-file risks | `csproj`, `requirements.txt` |
| V-28 | Low | Confirmed | Django insecure fallback `SECRET_KEY` | `backend-admin/backend_admin/settings.py:13` |
| V-29 | Info | Confirmed | Controls that were checked and found sound | various |

---

### Critical

#### V-01 – Credentials and signing keys committed to git (and in history)
- **Severity / Confidence:** Critical / Confirmed
- **Location (all tracked by git):**
  - `backend-api/CampusHostels.API/appsettings.json:3` – PostgreSQL connection string with password `[REDACTED]`; `:6` – JWT `SecretKey` `[REDACTED]` (a placeholder phrase).
  - `backend-api/CampusHostels.API/appsettings.Production.json:3` – PostgreSQL connection string (private LAN host) with password `[REDACTED]` (appears to be the same password as in `appsettings.json`); `:6` – the same JWT key.
  - `backend-api/CampusHostels.API/appsettings.Development.json:3` – connection string with password `[REDACTED]` for a **hosted Neon PostgreSQL** instance (eu-west-2); `:6` – a second JWT key.
  - `image-server/appsettings.json:10` and `image-server/appsettings.Development.json:3` – the same JWT keys again.
  - `appsettings.Development.json:30`, `appsettings.Production.json:35`, `EmailService.cs:39` – a personal Gmail address used as the sender.
- **Verified:** `git ls-files` lists all of the above; `git log` shows the config files have been tracked since 2025-11-11, so the values are in history even if removed now. `.env` is correctly untracked (`.gitignore` contains `*.env`), but `docker-compose.yml` depends on it.
- **Description:** Live-looking database passwords and JWT signing keys are committed. The Jenkinsfile clones `https://github.com/edwardalx/CampusHostels.git` without a credential ID (`Jenkinsfile:12-13`), which suggests the repository may be publicly readable. **Needs verification:** repository visibility.
- **Impact:** Anyone with repository access can reach the production or cloud database if network-reachable, and can forge JWTs if the key is in use (V-02). The Neon development database is internet-reachable by design, so the credential alone may be sufficient. If that database holds real customer data this is also a personal-data exposure.
- **Fix:**
  1. Rotate all named credentials now: Postgres user password, Neon role password, all JWT keys, SMTP/SendGrid/Whapi/Paystack keys if ever placed in tracked files.
  2. Remove secrets from tracked files; keep only empty placeholders. Supply values via environment variables, Docker secrets or a vault. Use `dotnet user-secrets` for local development (the project already has a `UserSecretsId`).
  3. Rewrite history (`git filter-repo`) only after rotation; rotation is the real remedy because forks and clones keep the old values.
  4. Add a secret scanner (gitleaks or GitHub secret scanning with push protection) to CI and a pre-commit hook.
  5. Check whether the repository is public; if so, assume the credentials have been harvested.

#### V-02 – Placeholder JWT key allows forged manager tokens
- **Severity / Confidence:** Critical / Confirmed in repository; **Needs verification** whether production overrides it (the `.env` is not visible).
- **Location:** `Program.cs:149-166` (key read, no strength or placeholder check); `ManagerTokenService.cs:30-41` (claims `scope=manager`, `managerTier`, `managerId`); `Program.cs:221-225` (policies rely solely on those claims); `image-server/Program.cs:9-35` (same key, same issuer/audience); `API/Extensions/JwtExtensions.cs:12` (dead code with a hard-coded fallback key); `docker-compose.yml` does not set `JwtSettings__SecretKey` for `backend_api` (lines 91-109), so the value must come from `.env` or falls back to the committed one.
- **Description:** Tenant and manager tokens are signed with the same symmetric key. Separation between them depends only on the `scope`/`managerTier` claims. If the key is the committed placeholder, anyone can sign a token with `scope=manager` and `managerTier=Super`.
- **Impact:** Full administrative access to every manager endpoint (tenant PII, payments, manager creation) and to image upload. Forged tenant tokens would also allow impersonation of any tenant GUID.
- **Fix:** Fail fast at start-up if the key is missing, shorter than 32 random bytes, or equals a known placeholder. Use a distinct key (or distinct audience) per service and per token type. Plan key rotation (support two keys during rollover). Remove the unused `JwtExtensions.cs`.

#### V-03 – Seeded Super Manager with documented credential, applied to production by migrations
- **Severity / Confidence:** Critical / Confirmed that the seed exists in the model and migration; **Needs verification** whether the production password has since been changed.
- **Location:** `Infrastructure/Data/ApplicationDbContext.cs:46-63` (username `superadmin`; the comment at line 47 states the password in clear – `[REDACTED]`; hash at line 58 is `[REDACTED]`); `Migrations/20260911143515_AddManagersTable.cs:44` (same seed row); `docker-compose.yml:36-54` and `Jenkinsfile:52` run `dotnet ef database update` against production on every deployment.
- **Description:** The comment calls it "dev-only", but `HasData` is not environment-gated, so it is part of every migration. The password hash is unsalted SHA-256 (V-08) of a short, documented password. `MustChangePassword = true` is enforced only in the admin UI (`frontend/campushostel-admin/src/components/ProtectedRoute.tsx:16`); nothing in `API/Controllers` references it (verified with `grep`), so a token issued at first login works on every endpoint without changing the password.
- **Impact:** If the seed row still carries the original password in production, any attacker who reads this repository can log in as a Super Manager.
- **Fix:** Remove the seed from the model and create the first Super Manager through a one-off, out-of-band step with a random password. In the existing database, rotate or delete the `superadmin` row and verify. Enforce `MustChangePassword` server-side (reject all but the change-password endpoint, e.g. via an authorisation handler). Remove the password from the comment.

---

### High

#### V-04 – Unauthenticated access to payments, tenancies and customer PII (IDOR chain)
- **Severity / Confidence:** High / Confirmed
- **Location:**
  - `PaymentsController.cs:59-65` `POST initialize`, `:72-90` `POST verify`, `:130-163` `POST verify-raw`, `:166-170` `GET tenancy/{tenancyId}`, `:172-176` `GET tenant/{tenantId}` – none has `[Authorize]`.
  - `TenanciesController.cs:46-52` `GET {id}`, `:54-65` `GET paid/{tenantId}` – no `[Authorize]` (an earlier claim-based check is commented out at `:57-59`).
  - `AccountsController.cs:151-168` `liked-hostels` (GET/add/remove) take `tenantId` from the query string with no auth and no ownership check; `:90-103` `check-email-phone` is anonymous.
  - There is no `FallbackPolicy` (`Program.cs:221-225` only registers named policies).
- **Verified chain:** `GET /api/Payments/tenancy/{int}` returns the `Payment` entity (`PaymentService.cs:232-238`), which includes `Email`, `Phone` and `TenantId` (`Domain/Entities/Payment.cs:9,12,22`). Tenancy IDs are sequential integers, so they can be enumerated. The returned `TenantId` GUID can then be passed to `GET /api/Tenancies/paid/{tenantId}`, which returns first name, last name, phone, email, property, unit and contract dates (`TenancyService.cs:418-444`). The customer app itself sends `tenantId` in the URL without a bearer header (`frontend/campushostel-fe/src/services/PaymentService.js:34`, `AuthServices.js:112`), so the API contract encourages this.
- **Impact:** Bulk disclosure of customer names, phone numbers, emails and payment history without logging in; tampering with any user's liked hostels. For UK GDPR this is a likely personal-data breach exposure if exploited.
- **Fix:** Add `[Authorize]` to all of these; derive `tenantId` from the `tenantId` claim and ignore or reject client-supplied values (return 403 if they differ); check tenancy ownership (`tenancy.TenantId == claim`) for `tenancy/{id}` and `Tenancies/{id}`. Return DTOs, never entities. Make `verify` callable only by the owner (or rely on the webhook plus an authenticated status endpoint). Set a global fallback policy of "authenticated" and opt out explicitly with `[AllowAnonymous]`. Add integration tests asserting 401/403.

#### V-05 – Any signed-in user can edit another user's profile (account-takeover path)
- **Severity / Confidence:** High / Confirmed (code); exploitation Likely
- **Location:** `AccountsController.cs:141-150` (`[Authorize]` but the target is `dto.Email`, taken from the body); `AccountService.cs:269-286`; `UpdateUserDto.cs`.
- **Description:** The caller's identity is never compared with the account being edited. A tenant can change another user's first name, last name and **phone number**.
- **Chain:** Phone number is an identifier for password reset. `PasswordResetService.cs:57` falls back to a phone lookup; the reset link is then sent by WhatsApp to `user.PhoneNumber` (`:110-115`), which the attacker has just replaced; `ResetPasswordAsync` (`:147`) looks up by email only, so the attacker supplies the victim's email plus the received token and sets a new password. The attacker needs a phone number not already registered (unique index at `ApplicationDbContext.cs:32`).
- **Impact:** Account takeover of any tenant whose email is known.
- **Fix:** Ignore `dto.Email`; load the user by the `tenantId`/email claim. Require re-authentication or OTP verification to change a phone number, and notify the old number/email.

#### V-06 – Password-reset link poisoning via `ResetUrlBase`
- **Severity / Confidence:** High / Confirmed
- **Location:** `Application/DTOs/RequestPasswordResetDto.cs:12-13` (client-supplied `ResetUrlBase`); `PasswordResetService.cs:85-93` (used as the link host, then placed unencoded into the email HTML); `AccountsController.cs:105-113` (anonymous endpoint).
- **Description:** An unauthenticated caller can request a reset for a victim's email with `ResetUrlBase` set to an attacker-controlled site. The victim receives a genuine email from the real sender whose link points to the attacker's site with a valid token in the query string.
- **Impact:** Reset-token theft and account takeover with one click by the victim. The same unencoded value allows HTML/attribute injection in the email.
- **Fix:** Remove `ResetUrlBase` from the DTO; build the link from `App:BaseUrl` only (or validate against a strict allow-list). HTML-encode all values placed in email HTML.

#### V-07 – `verify-reset` is a password oracle that bypasses lockout
- **Severity / Confidence:** High / Confirmed (code); response difference not exercised at runtime
- **Location:** `PasswordResetService.cs:118-131` (`VerifyResetTokenAsync` compares the supplied `NewPassword` with the stored hash **before** checking the token and throws if they match); `AccountsController.cs:116-128`; `ExceptionHandlingMiddleware.cs:58-62`.
- **Description:** Anyone who knows an account's email or phone can post a candidate password to `verify-reset` with any non-empty token. A matching password produces `{"error":"Validation failed."}` (via `ArgumentException`), a non-matching one produces `{"message":"Invalid or expired token"}`. The failed-attempt counter (`AccountService.cs:131-143`) is not touched. The same endpoint reveals whether the account exists (unknown user returns the token message at `:123-124`).
- **Impact:** Unthrottled online password guessing against any account, defeating the five-attempt lockout.
- **Fix:** Check the token first; only then compare with the old password, and do that comparison in `reset-password`, not in the verify step. Return identical responses for all failure modes. Add rate limiting (V-12).

#### V-08 – Unsalted SHA-256 password hashing, non-constant-time compare
- **Severity / Confidence:** High / Confirmed
- **Location:** `AccountService.cs:237-252` (comment says "dev-only"); used for managers at `ManagerService.cs:52,109,114,211`, for tenants at `AccountService.cs:57,138,250`, and for resets at `PasswordResetService.cs:125,162`. Comparison is `==` on strings (`:251`).
- **Impact:** A database leak (see V-01, V-04) allows near-instant offline cracking with rainbow tables or GPUs; identical passwords yield identical hashes.
- **Fix:** Use `Microsoft.AspNetCore.Identity.PasswordHasher<T>` (PBKDF2) or Argon2id, with per-user salt and `CryptographicOperations.FixedTimeEquals`. Re-hash transparently at next successful login; force reset for accounts that do not log in. Align the minimum password length (DTO says 8, `RegisterDtoValidator.cs:16` says 6) and check against a breached-password list.

#### V-09 – Google sign-in accepts any Google access token
- **Severity / Confidence:** High / Confirmed
- **Location:** `AccountService.cs:163-235`; `AccountsController.cs:83-88`.
- **Description:** The server calls Google's `userinfo` endpoint with whatever bearer token the client supplies and trusts the returned email. It does not check that the token was issued to this application's client ID (token-substitution attack), does not check `email_verified`, and creates users automatically (`:199-214`). `Authentication:GoogleClientId` appears in config (`appsettings.Development.json:17-19`, `Production.json:21-23`) but is never read (verified by `grep`); `Google.Apis.Auth` is referenced (`CampusHostels.API.csproj:27`) but `GoogleJsonWebSignature` is unused.
- **Impact:** A malicious site that obtains a user's Google access token for its own client can replay it here and sign in as that user (including existing password accounts with the same email).
- **Fix:** Verify a Google **ID token** with `GoogleJsonWebSignature.ValidateAsync` using `Audience = GoogleClientId`, require `email_verified`, and link accounts deliberately. Note the customer app's `useGoogleAuth` hook sends `idToken` (`GoogleAuthService.js:10-17`) while the API expects `accessToken` – one of the two paths is dead.

#### V-10 – Portainer with Docker socket routed to the public internet
- **Severity / Confidence:** High / Confirmed (configuration); **Needs verification** of Portainer's own auth/2FA and host firewall
- **Location:** `docker-compose.yml:146-159` (`/var/run/docker.sock` mounted at `:153`, port `9000:9000` published at `:156-157`, image `portainer-ce:latest` at `:147`); `nginx/conf.d/campushostels.conf:103-119` exposes it at `https://campushostels.duckdns.org/portainer/` with no IP restriction.
- **Description:** Access to the Docker socket is equivalent to root on the host; the `:ro` flag does not restrict the Docker API. The same vhost also exposes Django admin at `/admin/` (`:92-101`) and proxies `/swagger/` (`:44-51`).
- **Impact:** A Portainer credential compromise, brute force or unpatched vulnerability gives host takeover and access to every container's secrets.
- **Fix:** Remove the public route; reach Portainer through VPN/SSH tunnel or an `allow`/`deny` list. Unpublish port 9000. Pin the image version, enforce MFA, and consider removing Portainer from production. Restrict `/admin/` by IP as well.

---

### Medium

#### V-11 – Jenkins over plain HTTP; many ports published on the host
- **Location:** `nginx/conf.d/jenkins.conf:1-28` (listen 80 only, proxies to a private LAN address; no TLS server for this host – `certbot.conf` does not list it); `docker-compose.yml:13-14` (Postgres on `${DB_PORT}`), `:28-29` (MSSQL 1433), `:103-104` (API 5000, plain HTTP, bypassing nginx), `:139-140` (BookShelf app 6001), `:156-157` (Portainer 9000).
- **Impact:** Jenkins credentials and session cookies cross the network in clear; Jenkins holds an SSH key to the production host (`Jenkinsfile:19-23`). Published database and API ports are reachable from outside nginx if the host firewall allows it. **Needs verification:** host firewall rules.
- **Fix:** Serve Jenkins over TLS and restrict by IP/VPN. Remove host port mappings for databases and the API (nginx uses the Docker network); bind to `127.0.0.1` where host access is needed.

#### V-12 – No rate limiting; permanent manager lockout; account enumeration
- **Location / verified facts:**
  - No `AddRateLimiter`/`UseRateLimiter` anywhere in `backend-api` (verified by `grep`); no `limit_req` in `nginx/`.
  - Unthrottled: `POST Accounts/login` (`AccountsController.cs:44`), `POST Managers/login` (`ManagersController.cs:19`), `POST Accounts/request-reset` (`:105`, which sends email/WhatsApp – cost and harassment vector), `POST/GET check-email-phone` (`:90,97`), `register` (`:30`).
  - Lockout at five failures (`AccountService.cs:131-136`, `ManagerService.cs:46-50`) is **permanent for managers**: the counter is cleared only on a successful login (`ManagerService.cs:61`), which a locked account cannot perform, and `UpdateManagerAsync` (`:296-346`) does not reset it. Anyone who knows a username (e.g. the seeded `superadmin`, V-03) can lock the account out with five bad attempts. For tenants, `TenancyJob.cs:75-77` resets every user's counter daily as a side effect (about five guesses per account per day; managers are unaffected).
  - Enumeration: distinct messages for unknown account vs wrong password (`AccountService.cs:124` vs `:143`; `ManagerService.cs:38` vs `:56`), registration conflicts (`:42-43`), and `check-email-phone`.
- **Fix:** Add ASP.NET Core rate limiting per IP and per account on all auth endpoints, plus nginx `limit_req`. Replace permanent lockout with time-boxed lockout and an admin unlock action. Use one generic message for login failures. Make `check-email-phone` authenticated or remove it. Add CAPTCHA/OTP throttling on reset requests.

#### V-13 – Mass assignment on registration
- **Location:** `Application/DTOs/LoginDto.cs:22-23` (`RegisterDto.IsActive`, `RegisterDto.Role` are client-settable); `AccountService.cs:54,56`; role is written into the JWT (`TokenService.cs:41`).
- **Description:** Clients choose their own `Role` string and `IsActive` flag. `IsActive` is deliberately populated from the "agree to terms" tick box (`frontend/campushostel-fe/src/pages/RegisterPage.jsx:144`), so account activation depends on a client assertion. Role values are inconsistent (`"Tenant"` default, `"Student"` for Google users, `AccountService.cs:207`).
- **Impact:** Currently low because no `[Authorize(Roles=…)]` is used (manager access relies on the `scope` claim, which tenants cannot obtain), but any future role check would be bypassable, and activation can be self-asserted.
- **Fix:** Remove both properties from the DTO; set `Role="Tenant"` and the activation rule on the server.

#### V-14 – Payment integrity
- **Location:** `InitializePaymentRequest.cs` (client supplies `Amount`, `CallbackUrl`, `Currency`, `Email`, `Phone`); `PaymentService.cs:38-110`, `:167-230`; `PaymentsController.cs:92-127`.
- **Verified facts:**
  - The amount is whatever the client sends (`Range(1, double.MaxValue)`); a successful payment of any amount sets `tenancy.IsActive = true` and decrements bed availability (`PaymentService.cs:197-203`). **Needs verification:** whether part-payment/deposit activation is an intended business rule.
  - `VerifyPaymentAsync` does not compare Paystack's reported amount or currency with the stored payment.
  - No transaction, row version or concurrency token (`ApplicationDbContext.cs:141` only has a unique index on `Reference`). The status check at `:174` and the update at `:192-227` are not atomic, so a webhook and a client `verify` arriving together could credit `TotalAmountPaid` twice. Likely, not reproduced.
  - `CallbackUrl` is passed to Paystack unvalidated (`PaymentService.cs:64-67,97-104`): an arbitrary post-payment redirect.
  - The e-mail/phone "match" checks at `:53-60` are weak protection because both values are obtainable through V-04.
- **Positive:** the webhook signature check is correct (V-29).
- **Fix:** Compute the amount server-side (or validate against unit cost/outstanding balance), validate Paystack's `amount` and `currency` on verify, wrap verification in a transaction with an idempotency guard (`UPDATE … WHERE Status <> 'Success'`), allow-list callback URLs, require authentication on `initialize`.

#### V-15 – Authorisation scoping gaps
- **Unit creation:** `UnitsController.cs:44-70` requires only `RequireManager`. Unlike property creation (`PropertiesController.cs:182-196`), it does not check that the caller owns `propertyId` or holds the property-management function, so any manager can add units to any property.
- **Manager token staleness:** `RequireManager`/`RequireSuperManager` (`Program.cs:223-224`) trust claims set at login (`ManagerTokenService.cs:30-41`). A deactivated or demoted manager keeps access (including Super) for up to six hours.
- **Function disclosure:** `ManagersController.cs:63-75` lets any manager read any other manager's function list.
- **Ratings:** `RatingReviewController.cs:19-38` and `ReviewRatingService.cs:34-60` accept any `Score` (type `double`, no range), unlimited comment length, any property, and unlimited ratings per user, and do not require a tenancy – ratings can be inflated or abused.
- **Fix:** Add ownership/function checks to unit creation; re-validate manager status for sensitive operations (short token lifetimes plus a per-request status check or token version); add validators for ratings (range 1-5, one per user per property, tenancy required).

#### V-16 – Reset tokens and PII written to logs and the database
- **Location:**
  - `PasswordResetService.cs:92` logs the full reset link (containing the raw token) at Information level, unconditionally despite the `[DEV]` prefix. With Serilog console and file sinks (`appsettings.json:34-54`) and Portainer log access, anyone with log access can take over accounts.
  - `WhapiCloudService .cs:74-83` stores the complete WhatsApp message in the `Messages` table; for phone-based resets that is the reset link and raw token. `:73` also logs the full API response.
  - Email addresses or phone numbers logged at Information/Warning: `AccountService.cs:133`; `PasswordResetService.cs:62,101,105,115,128,159,177`; `TenancyJob.cs:38,62`; `WhapiCloudService .cs:72`. `EmailService.cs` (SendGrid) also persists the full HTML body of every email to `Messages`.
  - `Program.cs:192` logs the first eight characters of every presented bearer token (Debug level; avoid enabling Debug in production).
- **Fix:** Never log tokens or links; log a user ID, not email/phone; do not persist message bodies containing secrets (store a template ID and metadata); set retention for `Messages`; review Serilog levels in production.

#### V-17 – JWTs in `localStorage`, hard-coded lifetime, no revocation, no CSP
- **Location:** customer app `AuthServices.js:16-25,48-52`, `GoogleAuthService.js:51-61`; admin `ManagerAuthService.ts:35-36,41,77` (stores the whole auth response). Lifetime fixed at six hours in `TokenService.cs:34` and `ManagerTokenService.cs:30`; the configured `JwtSettings:ExpiresInMinutes` (`appsettings.json:9`) is never read. There is no refresh token or server-side revocation. The idle timeout is client-side only (`useIdleTimeout.js:4-5`, comment says 15 minutes, value is 5).
- **Impact:** Any future XSS would expose long-lived tokens. None was found (V-29), but nginx sets no CSP (V-18).
- **Fix:** Prefer short-lived access tokens with a refresh token in an `HttpOnly; Secure; SameSite` cookie; honour the configured lifetime; add a CSP; consider a token version/`jti` deny-list for logout and deactivation.

#### V-18 – No HSTS or security headers; HTTPS redirect only in Development
- **Location:** `nginx/conf.d/campushostels.conf:7-12` (TLS vhost without `add_header` for HSTS, CSP, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`); `nginx/nginx.conf` (no `server_tokens off`, no cipher policy, no `limit_req`, no `client_max_body_size` – default 1 MB while the image server allows 5 MB, so large uploads are probably rejected; **Needs verification**); `Program.cs:316` (`UseHsts` is ineffective behind a plain-HTTP upstream, as the header is only emitted on HTTPS requests) and `:321-324` (`UseHttpsRedirection` only in Development); `nginx/conf.d/images.conf:1-12` serves the image host over HTTP only; `campushostels.conf:137-151` adds `Access-Control-Allow-Origin: *` with one-year immutable caching; there is no `UseForwardedHeaders`, so the API sees the proxy address as the client.
- **Fix:** Add the headers at nginx; enable HSTS after confirming all subdomains support HTTPS; redirect the images host to HTTPS; configure forwarded headers in the API.

#### V-19 – Docker and CI hygiene
- **Location and facts:**
  - `backend-api/Dockerfile` and `image-server/Dockerfile` have no `USER` (containers run as root) and there is no `.dockerignore`. `COPY . .` places `appsettings.Development.json` (cloud-DB credential) and test projects in the build context; `dotnet publish` includes `appsettings*.json` by default, so the Development file is likely shipped in the production image (Likely).
  - `docker-compose.yml` passes the whole `.env` to `db`, `mssql`, `web`, `backend_api`, `image-server` and `app1` via `env_file` (`:5-6,22-23,71-72,96-97,116-117,135-136`), including the BookShelf app (`:130-144`, an unrelated codebase built from `/var/www/book-shelf-be`). Every container sees every secret.
  - Unpinned or floating images: `mssql/server:2019-latest` (`:20`), `portainer-ce:latest` (`:147`), `nginx:1.25-alpine` (old minor), `dotnet/sdk:9.0`.
  - `ef-migrator` installs `dotnet-ef` from the internet at deploy time (`:49`) and runs migrations automatically in production (also `Jenkinsfile:52`), including the V-03 seed.
  - `Jenkinsfile:27,83,124` and `Jenkinsfile.fe`/`.full` use `ssh -o StrictHostKeyChecking=no` (man-in-the-middle on deploy). Pipelines have no build, test, dependency-scan or secret-scan stage; deployment pulls `main` on the server after `git stash`. `docker compose down` precedes `up` (`Jenkinsfile:55-56`), causing downtime.
- **Fix:** Add `.dockerignore`; use multi-stage non-root images; per-service `environment`/Docker secrets instead of a shared `env_file`; pin image digests; pin host keys with `known_hosts`; add test, `dotnet list package --vulnerable`, `npm audit` and image-scan stages; separate the unrelated BookShelf stack.

#### V-20 – Image upload validation is extension-only
- **Location:** `image-server/Program.cs:87-158`.
- **Verified facts:**
  - Authentication: manager scope required (`:158`); category is allow-listed (`:89-92`).
  - **Path traversal is not possible:** the stored name is a GUID or a slug limited to `a-z0-9-` (`:119-145`, `Slugify` at `:162-173`); only the lower-cased extension of the client file name is used.
  - Gaps: only the file extension is checked (`:111-115`), not content type or magic bytes, so a non-image renamed to `.jpg` is stored and served from the public origin. No `X-Content-Type-Options: nosniff`. The size check (`:106`) runs after `ReadFormAsync` (`:99`) has buffered the request (default multipart limit about 128 MB), so oversized uploads still consume resources. No per-user rate limit or storage quota; any manager, whatever their function, can upload indefinitely. The same JWT key as the API (V-02). CORS falls back to `AllowAnyOrigin` if `AllowedOrigins` is empty (`:42-49`).
- **Fix:** Validate image signatures (or re-encode with an imaging library), set `RequestSizeLimit`/`FormOptions` limits before reading, add `nosniff`, add quotas and rate limits, require a specific function for uploads, and use a separate signing key/audience.

#### V-21 – SQLite database file tracked in git
- **Location:** `backend-api/CampusHostels.API/campushostels.db` (16 KB, tracked since the 2025-11-11 scaffold commit `9745647`).
- **Description:** A binary database file is committed. Its contents were **not inspected** (no database access by design). It may contain development test users, hashes or real data.
- **Fix:** Inspect it offline; if it holds any real or credential data, treat as a breach of that data and rotate. Remove from the repository and add `*.db` to `.gitignore`.

---

### Low and informational

#### V-22 – Exception detail leakage and error handling
- `ExceptionHandlingMiddleware.cs:58-62,64-68` returns `ArgumentException` and `UnauthorizedAccessException` messages to clients (`details`, `error`). The production filter at `:85` only suppresses one specific string, so other internal `ArgumentException` messages can surface. 500s return a generic message (good).
- `UnitsController.cs:36` dereferences `item!.PropertyId` before the null check at `:37`, so `GET /api/properties/1/units/99999` throws a null reference and returns 500 instead of 404.
- `Program.cs:315` configures `UseExceptionHandler("/error")` but no `/error` endpoint exists (`grep`), although the custom middleware normally catches first.
- **Fix:** Return stable, non-sensitive messages and a correlation ID; fix the null check.

#### V-23 – CORS
`Program.cs:232-245` allows placeholder and development origins in production (`http://your-frontend-domain.com`, `http://localhost:*`), an invalid origin with a trailing slash (`https://campushostels.duckdns.org/`), and `AllowCredentials()` although authentication is by bearer header. Load origins from per-environment configuration and drop `AllowCredentials`.

#### V-24 – Hangfire dashboard
`Program.cs:330` calls `UseHangfireDashboard()` with no authorisation filter. Hangfire's default permits local requests only; behind nginx/Docker this probably blocks remote access, but that is accidental. **Needs verification.** Add an explicit filter requiring `RequireSuperManager`, or disable the dashboard in production.

#### V-25 – Paystack client details
- `PaystackService.cs:132` compares the HMAC with `==` (not constant-time; use `CryptographicOperations.FixedTimeEquals`).
- `:71` interpolates the reference into the URL path unencoded (`transaction/verify/{reference}`), reachable from the anonymous `verify-raw` endpoint; use `Uri.EscapeDataString`.
- `:35` casts `amount * 100` to `int`, which overflows above about 21.4 million major units.
- `:52` includes the Paystack response body in an exception message (logged, not returned).

#### V-26 – HTML injection in emails
`AccountsController.cs:64-68` substitutes `FirstName` into `Templates/LoginNotification.html` without encoding (a user can register a name containing markup that is then emailed to themselves; limited impact). `PasswordResetService.cs:90-93` places the reset link into HTML unencoded (see V-06). Use `WebUtility.HtmlEncode`.

#### V-27 – Dependencies (not a substitute for a scanner)
- **Likely:** `backend-admin/requirements.txt` pins Django 5.1.7; the 5.1 series is past its security-support window and 5.1.7 predates several security releases. The file is also UTF-16 encoded, which `pip` may mishandle. Upgrade to a supported LTS and re-encode as UTF-8.
- **Needs verification:** `AutoMapper.Extensions.Microsoft.DependencyInjection 12.0.0` (`CampusHostels.API.csproj:24`) is an old major version; run `dotnet list package --vulnerable --include-transitive` to check advisories. `FluentValidation.AspNetCore 11.3.1` (`:26`) is no longer actively supported by its author. `Microsoft.AspNetCore.Authentication.JwtBearer 9.0.0` (`:48`, also `ImageServer.csproj:10`) is the initial 9.0 release; update to the latest 9.0.x.
- Hygiene: `Hangfire.SqlServer` is referenced but PostgreSQL is used (`:31` vs `Program.cs:98-101`). Test project uses `EntityFrameworkCore.InMemory 8.0.0` against EF Core 9. `frontend/campushostel-admin` tracks both `package-lock.json` and `pnpm-lock.yaml` (the Dockerfile uses pnpm), which invites drift.
- Frontend package versions looked current; no specific known-risky package could be justified from `package.json` alone. Run `npm audit`/`pnpm audit`.

#### V-28 – Django fallback secret
`backend-admin/backend_admin/settings.py:13` falls back to a hard-coded insecure `SECRET_KEY` if `DJANGO_SECRET_KEY` is unset. `DEBUG` defaults to false (`:17`), which is good. Remove the fallback and fail on start-up.

#### V-29 – Controls checked and found sound (for balance)
- **SQL injection:** no `FromSqlRaw`, `ExecuteSqlRaw`, `SqlQuery` or string-built SQL in `backend-api` (verified by `grep`); EF Core queries are parameterised.
- **XSS:** no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `document.write` in either React app (verified by `grep` / `git grep` at HEAD). External links use `rel="noopener noreferrer"` (`Footer.jsx:54-56`).
- **Paystack webhook:** HMAC-SHA512 over the raw body with the secret key and an empty-key guard (`PaystackService.cs:122-133`), invoked before any processing (`PaymentsController.cs:106`).
- **Token separation:** tenant tokens lack `scope=manager`/`managerTier`, so they cannot satisfy `RequireManager`/`RequireSuperManager` (`TokenService.cs:39-42` vs `ManagerTokenService.cs:36-41`), provided the signing key is secret (see V-02).
- **JWT validation:** issuer, audience, lifetime and signing key all validated with zero clock skew (`Program.cs:156-166`).
- **Manager data scoping:** maintenance, tenants, payments, properties and reports endpoints scope non-Super managers to properties they own (e.g. `MaintenanceController.cs:285-287`, `PropertiesController.cs:78`), and tenant maintenance requests are checked against the caller's own tenancies (`MaintenanceController.cs:62-79`).
- **Swagger and developer exception page** are enabled only in Development (`Program.cs:288-292`); `docker-compose.yml` sets `Production`.
- **Reset tokens** are 256-bit random, stored hashed, single-use and expire in one hour (`PasswordResetService.cs:66-72,78,163`), although they are then exposed through logs and the message table (V-16). `.env` is not tracked.
- **Health endpoint** (`HealthController.cs`) is anonymous but returns only service name, uptime and status.

---

### Quick wins (under a day each)

1. Rotate every credential named in V-01 and V-03; confirm repository visibility and make it private if not already.
2. Add `[Authorize]` and claim-derived `tenantId` to the endpoints in V-04 and V-05 (small code change, largest risk reduction).
3. Delete `ResetUrlBase` from `RequestPasswordResetDto` (V-06) and remove the reset-link log line `PasswordResetService.cs:92` (V-16).
4. Reorder `VerifyResetTokenAsync` so the token is checked first, and drop the old-password comparison there (V-07).
5. Remove the Portainer location from nginx and unpublish ports 9000, 5000, 1433, 6001 and the DB port (V-10, V-11).
6. Add a start-up guard rejecting short or placeholder JWT keys (V-02).
7. Remove the `HasData` seed and rotate/delete the existing `superadmin` row (V-03).
8. Add nginx security headers (HSTS, CSP, nosniff, frame-ancestors) and `limit_req` on `/api/Accounts/` and `/api/Managers/login` (V-12, V-18).
9. Add `.dockerignore`, a non-root `USER`, and pinned images (V-19).
10. Delete `campushostels.db` from git and add `*.db` to `.gitignore` (V-21).

---

### Data protection notes (UK GDPR and local law)

- **Personal data held:** names, email addresses, phone numbers, payment references, amounts, contract dates, WhatsApp/email message bodies (`Messages` table), liked hostels, and hashed passwords.
- **Exposure:** V-04 would constitute unauthorised access to personal data if exploited; if any exploitation is suspected, follow the incident process and assess ICO/regulator notification (72-hour clock) with the DPO.
- **Minimisation and retention:** message bodies and reset links are retained indefinitely in `Messages`; PII appears in application logs (7-day file retention, console/Docker logs). No retention policy, erasure or export endpoint was found in the code reviewed (not exhaustively assessed).
- **Environments:** the Development profile points at a hosted Neon database (`Program.cs:129-137` also prints "SQLite" while using Npgsql). If it holds real customer data, development use needs a lawful basis and access controls; otherwise use synthetic data.
- **Processors and transfers:** phone numbers and message content are sent to Whapi.Cloud, Paystack, SendGrid/SMTP (Gmail) and Google. Confirm data-processing agreements and international-transfer mechanisms. Customers appear to be in Ghana/Nigeria, so local law (e.g. Ghana Data Protection Act 2012) may apply; seek legal advice.
- This report is not legal advice. Recommend specialist review.

---

## Part 2 – Bad code and code smells

Method: `grep`/`git grep` plus a small script to find runs of three or more consecutive `//` lines that look like code. Excluded: `node_modules`, `bin`, `obj`, `dist`, `Migrations`. Customer-app counts and line numbers are against HEAD `68f34db`.

### a) Commented-out code blocks

| Area | Blocks | Approx. lines | Worst offenders (file: line ranges) |
|------|--------|---------------|-------------------------------------|
| Backend (`.cs`) | about 16 multi-line blocks, plus about 54 single commented statements | about 100 | `PaymentsController.cs`: 32-57 (an entire commented DTO class) and 67-70, plus 55-57; `SmtpEmailSender.cs`: 12-20 (old options class); `ReviewRatingService.cs`: 22-29, 68-71; `ReviewRateCreateDto.cs`: 4-11; `EfReviewRatingRepository.cs`: 14-17, 24-27; `Rating.cs`: 15-21 (commented `Review` class); `PaystackService.cs`: 40-45; `AccountsController.cs`: 59-63; `TenancyJob.cs`: 57-60 and 36; `LoginDto.cs`: 43-46; `TenanciesController.cs`: 57-59; `Program.cs`: 97, 110-112 |
| Admin (`.ts/.tsx`) | 0 | 0 | none found |
| Customer app (HEAD) | 3 blocks, about 18 single-line, 3 JSX comment-wrapped blocks | about 16 + 18 | `homepage.jsx`: 236-244 (commented close button); `HostelGrid.jsx`: 29-32; `LoginPage.jsx`: 89-91, plus 6 single lines (e.g. 64-65); `App.jsx`: 54 and neighbours; `HostelDetails.jsx`: 10 (commented import of `UnitTile2`) |
| Whole files | `Domain/Entities/Tenant.cs` is entirely a commented-out placeholder (file header and block comment) | | see e) |

Note: the script uses a heuristic and can split blocks at blank lines; line ranges are indicative.

### b) Debug output

| Item | Count | Where |
|------|-------|-------|
| `console.*` in customer app (HEAD) | **47 statements in 16 files** | `RegisterPage.jsx` 7 (lines 174,176,196,210,211,223,230), `homepage.jsx` 6 (59,83,94,111,117,137), `LoginPage.jsx` 5 (42,44,69,82,87), `HostelServices.js` 4 (11,23,34,45), `Payments.jsx` 4 (73,79,101,112), `Header.jsx` 4 (46,70,75,79), `PaymentService.js` 3 (15,29,43), `HostelDetails.jsx` 3 (40,56,71), `App.jsx` 2 (33,35), `AuthServices.js` 2 (15,114), `GoogleAuthService.js` 2 (24,29), plus one each in `ReviewHostelPage.jsx:36`, `PaymentHistory.jsx:15`, `useIdleTimeout.js:89`, `Rate.jsx:39`, `ErrorBoundary.jsx:14` |
| `console.*` in admin app | 0 | – |
| `debugger` (any frontend) | 0 | – |
| `Console.WriteLine` (backend) | **7 in 2 files** | `Program.cs:131,141,301,305,310,334`; `MyWorker .cs:14` |
| `Debug.WriteLine` | 0 | – |

Sensitive console output (should be fixed first): `RegisterPage.jsx:210` logs the whole registration payload **including the plaintext password** (`mapppedData`, built at `:138-145`); `AuthServices.js:15` and `LoginPage.jsx:42` log the login response including the JWT; `RegisterPage.jsx:174,211` log the registration response and email; `Payments.jsx:101` and `PaymentService.js:15,29,43` log payment responses (reference, amounts).

### c) TODO / FIXME / HACK markers

- Customer app: 2, both stale – `LoginPage.jsx:70` ("Handle login logic") and `RegisterPage.jsx:212` ("Handle registration logic"), in functions that already implement that logic.
- Admin app, backend, image server, nginx, CI: 0. (A `grep` hit at `AccountsController.cs:115` is the placeholder text `token=xxx`, not a marker.)

### d) Hardcoded URLs, hosts and magic values

| Location | Value type |
|----------|------------|
| `Program.cs:232-245` | CORS origins list, including a placeholder domain and a trailing-slash origin |
| `Program.cs:117`, `WhapiCloudService .cs:29`, `AccountService.cs:174` | Paystack, Whapi and Google URLs as code defaults/literals |
| `image-server/Program.cs:55`, `image-server/appsettings.json:23`, `:14-20` | image host and allowed origins (HTTP host as default) |
| `EmailService.cs:39`, `SmtpEmailSender.cs:50,58` | sender and support addresses hard-coded (one is a personal Gmail address) |
| `PaymentService.cs:121-123,139,155` | placeholder email `noreply@…local` and phone `"0000000000"` used as real defaults |
| `TokenService.cs:34`, `ManagerTokenService.cs:30` | token lifetime `AddHours(6)` instead of configuration |
| `AccountService.cs:131`, `ManagerService.cs:46` | lockout threshold `5` duplicated |
| `Program.cs:270`, `TenancyJob.cs:25` | schedule differs by environment; leftover "I'm testing Hangfire" log in a production job |
| `frontend/campushostel-admin/src/services/ImageService.ts:6`, `vite.config.ts:13` | `localhost:5080` / `localhost:5000` |
| `frontend/campushostel-fe/src/utils/imageUrl.js:6`, `HostelCard.jsx:35` | production image host and a fixed fallback image URL `http://images…duckdns.org/…/Room11.jpeg` (HTTP, mixed content risk) |
| `Footer.jsx:25-27` and `homepage.jsx:261-263` | social links duplicated in two files |
| `LoginPage.jsx:105`, `RegisterPage.jsx:608` | third-party stock/hosted hero images (Unsplash, Google user content): external dependency and third-party IP disclosure |
| `docker-compose.yml:62,123`, `nginx/conf.d/*.conf`, `Jenkinsfile*` | public hostname, private IP and a user home path repeated across files |

### e) Unused or placeholder files, unused imports, duplication

Unused / placeholder / orphaned:
- `Domain/Entities/Tenant.cs` – fully commented out.
- `Application/Services/PlaceholderService.cs`, `Infrastructure/Repositories/PlaceholderRepository.cs` – sample stubs, never used.
- `Application/BackgroundServices/MyWorker .cs` – registration commented out (`Program.cs:97`), contains `Console.WriteLine`; filename has a trailing space.
- `API/Extensions/JwtExtensions.cs` – never called (`AddJwtAuthentication`), carries a hard-coded fallback key.
- `EmailService` (SendGrid) is registered and injected into `AccountsController` (`:15,24`) but only used in commented-out code.
- `CampusHostels.API.http` – template `weatherforecast` request.
- `campushostels.db` (tracked SQLite file), `backend-admin/hostel_admin/migrations/__pycache__/__init__.cpython-313.pyc` (tracked despite `.gitignore`).
- `scripts/init.sql`, `nginx/conf.d/bookshelf.conf`, `music.conf`, `upstreams.conf` (`bookshelf_app`), and the `app1`/`mssql` services in `docker-compose.yml` belong to an unrelated BookShelf project. `scripts/init.sql` is a BookShelf MSSQL migration script, not CampusHostels. No credentials were found in it.
- `frontend/campushostel-fe/src/components/UnitTile2.jsx` (98 lines) – import commented out in `HostelDetails.jsx:10`; superseded by `UnitTile.jsx`.
- 23 Markdown files tracked in the repository (`COMPLETION_REPORT.md`, `PROJECT_SUMMARY.md`, etc.) – status/agent notes rather than maintained documentation.
- Unused packages/imports: `Hangfire.SqlServer` (`csproj:31`); `using Sprache;` in `PasswordResetService.cs:13` (no use); `_mapper` field and `System.ComponentModel.DataAnnotations` import in `PaymentsController.cs`; `Microsoft.Extensions.Options` in `PaymentService.cs:8`; `_emailService` in `AccountsController.cs`.

Duplicated code:
- `NormalizePhone` is copied three times: `AccountService.cs:98`, `ManagerService.cs:363`, `PasswordResetService.cs:42`.
- The mapping to `ManagerProfileDto` is repeated five times in `ManagerService.cs` (around lines 86, 169, 219, 242, 333).
- The manager-scope boilerplate (`FindFirst("managerId")` and `HasClaim("managerTier","Super")`) is repeated in 7 controllers (`Dashboard`, `Maintenance`, `ManagedPayments`, `Managers`, `Properties`, `Reports`, `Tenants`); the paging/validation block is similar across list endpoints.
- Test duplication: `backend-api/tests/CampusHostels.Application.Tests/` and `.../CampusHostels.Infrastructure.Tests/` both define `PaymentServiceTests`, `PropertyServiceTests`, `UnitServiceTests` with near-identical content (Unit tests differ by about 83 diff lines).
- Admin services repeat the "read token, fetch, `response.json()`, check `ok`" pattern in 11 files (21 call sites) with no shared HTTP helper; the customer app does the same in 7 files (23 call sites).

### f) Empty catch blocks and swallowed exceptions

- No truly empty `catch {}` blocks were found (frontend and backend).
- Swallowed or overly broad:
  - `Program.cs:308-311` – any migration failure is printed with `Console.WriteLine` and ignored (the app starts against a possibly unmigrated schema). Also `:303-307` falls back to `EnsureCreated()` for a pending-model-changes error.
  - `Program.cs:360-362` – bare `catch` in `ResolveSqlitePath`.
  - `PaymentsController.cs:147` – bare `catch` around JSON parsing in `verify-raw` (commented as intentional).
  - `PaystackService.cs:117-120` – catches all exceptions and returns a failed verification, so network faults are reported as "payment failed".
  - `WhapiCloudService .cs:96-105` – catches all, returns `Success = false`; the caller (`AccountsController.cs:52-56`) ignores the result. `PasswordResetService.cs:103,175` – log and continue (intentional, but the user is told success).
  - `ExceptionHandlingMiddleware.cs:37` – catch-all by design.
  - Reliability issue: `AccountsController.cs:69-74` awaits `SendEmailAsync`, which rethrows on SMTP failure (`SmtpEmailSender.cs:69-73`), so an email outage returns HTTP 500 **after** credentials were accepted and the lockout counter was reset – login is coupled to email delivery.
- Customer app: about 22 `catch` blocks, most only `console.*` and (in places) no user feedback (e.g. `homepage.jsx:83,117,137`, `HostelDetails.jsx:40,56`). `fetch` error handling is inconsistent: `GoogleAuthService.js:37-64` never checks `res.ok` and returns `undefined` on failure; services call `await response.json()` before checking `response.ok` (e.g. `AuthServices.js:11,42,63,84,103`, `PaymentService.js:11,25,39`), which throws a parse error on non-JSON gateway errors (502/504 from nginx).
- Admin app: services follow the same json-before-ok pattern (`ManagerAuthService.ts:12,29,44,59`).

### g) Other bad practices

- **Test project with an absolute path on another machine:** `backend-api/tests/CampusHostels.Infrastructure.Tests/CampusHostels.Infrastructure.Tests.csproj:16` references `C:\Users\obedd\MyAlxProjects\CampusHostels\backend-api\CampusHostels.API\CampusHostels.API.csproj`. It will not build on any other machine or CI. `CampusHostels.Application.Tests/` has no `.csproj` at all (3 orphaned test files). `*.sln` is git-ignored, so there is no solution to build or test from. The only `.csproj` that references the API correctly is the integration test project (`..\..\CampusHostels.API\…`).
- **Misspelt or misleading identifiers and routes:** `initailizePayments` (`PaymentService.js:3`), `mapppedData` (`RegisterPage.jsx:138,210`), "backgrond" (`Program.cs:261`), `WhatsAppService` class in `WhapiCloudService .cs` (global namespace, trailing-space filename), double-`API` namespace (`CampusHostels.API.API.Controllers`), `IReviewRating`/`RatingReviewController` naming. XML-style route comments are wrong: `AccountsController.cs:104,115,130,140` say `/api/account/…` (actual route is `api/Accounts`), and `:115` says GET for a POST. Two controllers share `api/Payments` (`PaymentsController`, `ManagedPaymentsController`); `ManagedPaymentsController` is named for its route but lives separately.
- **Comments that contradict code:** `useIdleTimeout.js:4-5` ("15 minutes"/"1 min" vs 5 min/30 s) and `:88`; `Program.cs:131` ("SQLite" while using Npgsql); `TenancyJob.cs:76` ("reset on successful login" in a scheduled job); `docker-compose.yml:62` `VITE_API_URL` is a runtime env var for a build-time Vite setting and has no effect.
- **Inconsistent validation:** password minimum 8 (`LoginDto.cs:19`) vs 6 (`RegisterDtoValidator.cs:16`); `Role` values `Tenant`/`Student`; `PropertyCreateDto` has no validator (no name/location length, price range); unit/tenancy DTOs carry redundant `PropertyId` that conflicts with the route (`UnitsController.cs:9`). Email sender display name is overwritten by an assignment inside the argument list (`SmtpEmailSender.cs:50`: `display=_config["Smtp:Display"]`), so the `display` parameter passed by callers is ignored.
- **Design smells:** `Program.cs` mixes startup, migrations and seeding (`:288-317`); services with `Console`/`ILogger` mix; `TenancyJob.CheckTenancies` loads all tenancies and all users into memory and runs `foreach` queries per row (N+1, `TenancyJob.cs:5-60`), and resets login counters (unrelated side effect); controllers use `HttpContext.RequestServices.GetService<IValidator<…>>()` for manual validation (`TenanciesController.cs:24-31`, `UnitsController.cs:48-56`) even though `AddFluentValidationAutoValidation()` is registered; entities returned directly from controllers (`PaymentsController`, `RatingReviewController`).
- **Giant components (lines):** customer app (HEAD) `RegisterPage.jsx` 636, `Payments.jsx` 380, `HostelDetails.jsx` 351, `LoginPage.jsx` 287, `homepage.jsx` 268, `Header.jsx` 221, `MaintenancePage.jsx` 216. Admin app is better structured: largest are `ManagersListPage.tsx` 275, `CreateUnitPage.tsx` 252, `MaintenancePage.tsx` 249.
- **`any` types:** none found in the admin TypeScript (`: any`, `as any`, `<any>` searched). Customer app is plain JavaScript with no type or prop-type checking.
- **Inline styles:** negligible – 2 `style={{` in the customer app (`TenancyAgreement.jsx`, `TenancyAgreementForm.jsx`), 1 in the admin app (`OccupancyChart.tsx`). Tailwind is used throughout.
- **React keys:** `.map` count and `key=` count are close in both apps (customer 24/23, admin 30/23 – the admin gap needs a closer look). Index keys are used in about ten places in the customer app (`HostelDetails.jsx:144,242,278,294`, `Rate.jsx:15,48`, `UnitTile.jsx:80`); acceptable for static lists, risky for dynamic ones.
- **Other:** lint is gated only by a Husky pre-commit hook in the customer app (`.husky/pre-commit`), not in CI; two lock files in the admin app (V-27); `vite.config.js:9-12` loads every variable from the repository-root `.env` into `process.env` of the build (only `VITE_`-prefixed values reach the bundle, but the pattern is risky if `envPrefix` is ever widened).

---

## Recommended remediation order

1. **Today:** rotate all committed credentials and JWT keys; confirm repository visibility; rotate/delete the seeded `superadmin` account; remove the public Portainer route and unpublish database/API ports (V-01, V-02, V-03, V-10, V-11).
2. **This week – stop data exposure:** authenticate and scope the endpoints in V-04 and V-05; delete `ResetUrlBase`; fix the `verify-reset` ordering; stop logging and persisting reset links and PII (V-06, V-07, V-16).
3. **This week – hardening that is cheap:** start-up guard for JWT keys; server-side `MustChangePassword`; rate limiting and nginx limits; security headers; Google ID-token validation (V-02, V-03, V-09, V-12, V-18).
4. **Next sprint – authentication model:** replace SHA-256 with a salted adaptive hash and migrate on login; replace permanent lockout with timed lockout; remove `Role`/`IsActive` from registration; shorten token lifetimes and move to cookie-based refresh; add revocation (V-08, V-12, V-13, V-17).
5. **Next sprint – payments and authorisation:** server-computed amounts, Paystack amount/currency validation, idempotent verification, callback allow-list, unit-creation ownership checks, rating validation (V-14, V-15).
6. **Next sprint – platform:** non-root images, `.dockerignore`, pinned images, per-service secrets, host-key pinning, CI stages for tests and vulnerability/secret scanning, image-upload content validation and quotas (V-19, V-20), remove `campushostels.db` (V-21).
7. **Ongoing – quality:** fix the test project path and add the missing `.csproj`/solution so tests run in CI; remove dead code and commented-out blocks, console logging (starting with the password and token logs), and the unrelated BookShelf artefacts; extract shared helpers (phone normalisation, manager scope, fetch wrapper); fix typos and stale comments; upgrade Django and run dependency audits (V-27, Part 2).
8. **Governance:** DPO/legal review of data exposure, retention, processors and cross-border transfers; document an incident response path for suspected misuse of V-04.

---

## Appendix – already addressed on branch `feature/fe-mobile-modernisation`

The customer-app line numbers in this report are against commit `68f34db`. The mobile redesign on this branch removed some of the items above as a side effect, so re-run the searches in Part 2 after merging rather than trusting the counts:

- Plaintext registration payload (including the password) is no longer written to the browser console (`RegisterPage.jsx`, was lines 210-211).
- Debug `console.*` output, commented-out blocks and unused imports were removed from files that were rewritten: `Header.jsx`, `LoginPage.jsx` (including the full login response, which contains the token), `homepage.jsx`, `HostelCard.jsx`, `HostelGrid.jsx`, `Footer.jsx`, `PaymentHistory.jsx`, `SkeletonCard.jsx`.
- The unused `tailwind.config.js` was deleted (Tailwind v4 does not load it; the design tokens now live in `src/index.css`).

Nothing in Part 1 (the security vulnerabilities) has been fixed by that work. None of the backend, nginx, Docker or CI findings were touched.

---

## Appendix – fixed on branch `fix/security-hardening`

Status of the highest-severity items after this branch. "Fixed in code" does not mean the live system is safe until the deployment steps below are done.

| ID | Status | What changed | Still to do (operations) |
|----|--------|--------------|--------------------------|
| V-01 Committed credentials | **Partly fixed** | Database connection strings and JWT keys removed from every tracked `appsettings*.json` (API and image server). They are read from environment variables / a git-ignored `.env` (templates: `.env.example`, `backend-api/CampusHostels.API/.env.example`, `image-server/.env.example`). `dotnet ef` now reads `.env` too and no longer silently falls back to SQLite. | **Rotate every value that was ever committed** (production and Neon database passwords, all JWT keys). They remain in git history, so removal alone does not make them safe. Then set `JwtSettings__SecretKey` (and the DB password) in the server `.env`. |
| V-02 Weak or shared JWT key | **Fixed in code** | The API and image server refuse to start without a `JwtSettings:SecretKey` of 32+ characters. The unused `JwtExtensions.cs` (hard-coded fallback key) was deleted. `ef-migrator` now receives the `.env`. | Use a new random key on the server and the **same** value for the API and image server. All users are signed out when it changes. |
| V-03 Seeded Super Manager | **Fixed in code** | The seed was removed from the model. Migration `LockSeededSuperAdmin` replaces the documented password with a marker nobody can match (only if the account still has that password). `MustChangePassword` is now enforced by the API: a flagged token can only reach `me` and `change-password`, which then returns a fresh token. `Bootstrap__SuperManagerPassword` (12+ characters) restores access once. | Apply the migration. If you rely on `superadmin`, set the bootstrap password once, sign in, change it, remove the setting. Review other manager accounts for weak or default passwords. |
| V-04 Unauthenticated payment and tenancy endpoints | **Fixed in code** | Everything in `PaymentsController` now requires a signed-in tenant (the Paystack webhook stays anonymous and signature-checked). Payments and tenancies are checked against the caller's own `tenantId` claim; other people's records return 403/404. Responses use DTOs, not entities. The test-only `verify-raw` endpoint was removed. Liked-hostels endpoints require the caller's own tenant id. The customer app sends its token on these calls. | – |
| V-05 Editing another user's profile | **Fixed in code** | `/Accounts/update` only accepts the caller's own email. | – |
| V-06 Reset-link poisoning | **Fixed in code** | `ResetUrlBase` removed from the request. The link host comes only from `App:BaseUrl`. The link is HTML-encoded in the email, is no longer written to the logs, and phone links now use the key the reset page reads (`PhoneNumber`). Requests are limited to 5 per account per hour, and a new request cancels older links. | Make sure `App:BaseUrl` is correct in production (`appsettings.Production.json` already has it). |
| V-07 `verify-reset` password oracle | **Fixed in code** | `verify-reset` now checks the token only. The "same as old password" rule moved to `reset-password`, after the token has been proved, and leaves the token usable. A successful reset clears the lockout and cancels other links. Account lookup by phone now works for reset (it only worked by email before). | – |
| V-08 Unsalted SHA-256 passwords | **Fixed for new and active accounts** | PBKDF2-HMAC-SHA256 (600,000 iterations, random salt, constant-time compare) for tenants and managers. Old hashes still work and are upgraded automatically at the user's next successful sign-in. Registration minimum aligned to 8 characters. | Accounts that never sign in again keep the old hash. After a few months, consider forcing a reset for accounts still on SHA-256 (their hash does not start with `v2.`). |
| V-10 Public Portainer | **Fixed in config** | The `/portainer/` route is removed from nginx, the port is bound to `127.0.0.1` only, and nginx no longer depends on the Portainer container. Use `ssh -L 9000:127.0.0.1:9000 <user>@<server>` and browse to `http://localhost:9000`. | After deploying, check `https://<domain>/portainer/` is gone. Pin the Portainer image to a version instead of `latest`, and set a strong Portainer admin password. |

Not addressed yet: V-09 on the live site (the code side was fixed on `fix/google-signin`; it needs the client ID configured), V-11 (Jenkins over HTTP; database, MSSQL and API ports published on the host), V-12 (login rate limiting, permanent manager lockout), and V-13 onwards.

Tests: `SecurityTests.cs` and `PasswordSecurityTests.cs` add 40 tests for the rules above. The test project's reference to another machine's path was corrected. Five older tests (`AccountServiceTests`, `PaymentServiceTests`) were already failing before these changes and still fail.

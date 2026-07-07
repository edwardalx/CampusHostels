# Frontend Functional & Architectural Improvement Suggestions

This document lists issues found while reviewing `frontend/campushostel-fe` that go
beyond visual/UI polish. Most of the concrete bugs and dead code originally listed
here have since been fixed directly on `feature/ui-modernization` (see "Fixed in
this branch" below) because they were unambiguous and safe — either the code
referenced an undefined variable (a guaranteed crash) or was provably unreachable.
What remains below are items that need a **design/architecture decision** before
touching them, so they're documented rather than changed silently.

`npm run lint` went from **72 errors / 8 warnings** on `main` to **0 errors / 5
warnings** on this branch. The remaining 5 warnings are listed under "Still
open" below. A pre-commit hook (husky) now runs `npm run lint` on every commit
and blocks it if there are any errors — see "Pre-commit lint hook" at the
bottom.

---

## Fixed in this branch

These were bugs or dead code with an unambiguous, safe fix (no product/behaviour
decision required), so they were corrected directly rather than just documented:

- **The entire Login/Register page went blank with no `VITE_GOOGLE_CLIENT_ID`
  configured** — which is the case in a fresh checkout, since no `.env` file
  exists anywhere in the repo. `LoginPage`/`RegisterPage` call `useGoogleLogin()`
  unconditionally at the top of the component; when the client ID is
  missing/invalid, Google's own `accounts.google.com/gsi/client` script throws
  during that hook's init effect, and with no error boundary in the tree React
  unmounts the whole page — including the plain email/password form, which has
  nothing to do with Google. Confirmed this reproduces identically on unmodified
  `main`. Fixed by extracting the hook into its own `GoogleLoginButton`
  component and wrapping it in a new `ErrorBoundary` on both pages, with a
  disabled "Google sign-in unavailable" fallback button. Verified with a
  headless-browser pass against the real backend: Home, About, Contact, 404,
  Login, and Register all render correctly now; Login/Register previously
  rendered a blank white page.
- **Local dev environment**: `npm run dev` / `npm run build` failed here with
  `Cannot find native binding … @rolldown/binding-win32-x64-msvc`. This turned
  out to be a one-off interrupted install on this machine, not a lockfile gap —
  `package-lock.json` already listed the correct optional dependency. Fixed by
  reinstalling; no repo changes were needed (`package-lock.json` was reverted
  after confirming a full reinstall churns ~500 unrelated transitive-dependency
  bumps that don't belong in this diff).
- **`ReviewHostelPage.jsx` crashed on submit** — `setReviews` was called but never
  defined (`reviews` was a prop, not state). Worse, `homepage.jsx`'s usage of this
  component didn't even pass a `reviews` prop, so `reviews.length` would have
  thrown there too. Fixed by giving the component its own local `reviews` state
  (seeded from the prop, defaulting to `[]`) that it updates after a successful
  submission — restores the "list refreshes after you submit a review" behaviour
  the commented-out old code was clearly trying to do. Also swapped the fragile
  `formData.get("Rate") || JSON.parse(sessionStorage.getItem("selectedRating"))`
  for the `selectedRating` state that was already sitting right there (there's no
  `Rate` form field, so that branch always fell through to sessionStorage anyway).
- **`HostelDetails.jsx` threw `ReferenceError: storedHostel is not defined`** (and
  a second, similar `hostel is not defined`) whenever `hostelId` was falsy — the
  `storedHostel` fallback variable was referenced but its declaration was
  commented out. Removed the dead fallbacks.
- **`RegisterPage.jsx` — Google sign-up error path called `setErrorMsg`**, which
  doesn't exist in this component (it's `setErrorMessage`). Fixed the typo; a
  failed Google registration would previously have thrown instead of showing the
  error.
- **`ResetPasswordPage.jsx` — wrong comparison in `validatePassword`**:
  `password.length !== confirmPassword` compared a number to a string. Fixed to
  `password.length !== confirmPassword.length`.
- **`Payments.jsx` — typo swallowed the tenancy-creation error message**:
  `error.messsage` (triple "s") is never a real property; fixed to `error.message`.
- **`homepage.jsx` — dead code referencing an undefined setter.** `handleSearch`,
  `handleHostelLike`, `handleFilterClick`, `handleNavClick` (which called a
  non-existent `setActiveNavLink`), and the `filteredHostels`/`handleViewDetails`
  pair were all unreachable — `SearchBar` is commented out and `HostelCard`
  navigates on its own via `<Link>`, never calling the `onViewDetails` prop that
  was being threaded through. Removed; see "Still open" below re: re-enabling
  search properly.
- **Async work started inside a `try` without `await`, across `Payments.jsx`,
  `homepage.jsx`, `HostelDetails.jsx`, and `PaymentReceipt.jsx`.** The repeated
  pattern was:
  ```js
  try {
    setIsLoading(true);
    const fetchThing = async () => { ... };
    fetchThing(); // not awaited — its rejection lands outside this try
  } catch (error) {
    // never reached for errors thrown inside fetchThing
  }
  ```
  so a failed fetch never actually hit the `catch`, and loading/empty states
  could get stuck. Rewrote each as a single `async function` declared and
  awaited inside the effect, with the loading flag set at the top of that
  function and cleared in a `finally`. Side effects of doing this properly:
  - `homepage.jsx`'s hostel-list effect no longer refetches on every
    review-modal open/close (was `[showReviewForm]`, now fetches once on `[]`
    — this was also "Still open" item 8 in a previous revision of this doc).
  - `homepage.jsx`'s empty-results case now actually sets `isEmpty` (previously
    only the error path did; a genuinely-empty response left the skeleton
    loaders spinning forever).
  - `HostelDetails.jsx` no longer has an artificial `setTimeout(…, 600)` before
    clearing its loading state — it now clears exactly when the fetch settles.
  - `PaymentReceipt.jsx`'s `.then/.catch/.finally` chain (which also called
    `setLoading(false)` twice, once immediately and once after a fake 500ms
    delay) became a plain `async/await` with one `finally`.
  - `ResetPasswordPage.jsx`'s password-mismatch check was a `useEffect` whose
    only job was calling `setError()` from a pure function of
    `password`/`confirmPassword` — classic "you might not need an effect".
    Replaced with a derived `passwordsMismatch` value computed at render time;
    removed the effect entirely.
  - `Payments.jsx` also had a `payload` object built once from render-scope
    `const`s, then mutated in place later (`payload.tenancyId = tenancyId`).
    Replaced with a `buildPaymentPayload(tenancyId)` function that constructs
    a fresh object at call time. Also switched the payment-gateway redirect
    from `window.location.href = url` to `window.location.assign(url)` — the
    former reads as a mutation-after-render to static analysis; the latter is
    the same behaviour without that ambiguity.
  This is also what eliminated all 9 of the remaining `react-hooks/set-state-in-effect`
  / "cannot modify"-style lint **errors**. Verified with a headless-browser pass
  against the real backend after each file: homepage listing, hostel details
  (rooms + reviews), and the reset-password mismatch hint (appears/disappears
  correctly on matching vs. non-matching same-length input) all behave the same
  as before, just without the lint errors or the underlying dead-catch bug.
- **`PaymentHistory.jsx` — dead/confusing state initialiser**
  (`useState([])||response` where `response` wasn't even declared yet) cleaned
  up to a plain `useState([])`.
- **404 page**: the catch-all route rendered a single unstyled `<p>` with no
  header, layout, or way back. Replaced with `pages/NotFoundPage.jsx` (styled,
  includes a "Back to Home" link) and moved the route inside the `MainLayout`
  group so it gets the site header.
- A large batch of unused imports/variables across ~15 files (mostly leftovers
  from refactors — e.g. `redirect`, `useParams`, `likeProperty`/`unlikeProperty`
  in `HostelCard.jsx`; `useIdleTimeout`/`showSessionExpiredAlert` duplicated in
  `Header.jsx`; dead `getHostelById`/`storedHostel` state in `ReviewHostelPage`).
  Also fixed two "cannot reassign variable in async function" issues
  (`PaymentHistory.jsx`, `TenancyAgreement.jsx`) by declaring the `response`
  variable inside the async callback instead of an outer `let`.
- `AuthContext.jsx` exported both a component (`AuthProvider`) and a plain value
  (`AuthContext`), which breaks React Fast Refresh for that file. Split the raw
  context into `zu-store/AuthContextInstance.js`; `AuthContext.jsx` now only
  exports the provider component. The two consumers (`Header.jsx`,
  `homepage.jsx`) were updated to import the context from the new file.
- `vite.config.js` uses Node globals (`__dirname`, `process`) that the project's
  flat ESLint config only declared browser globals for. Added a config-file
  override in `eslint.config.js` rather than suppressing the rule.

---

## Still open — needs a product/architecture decision

1. **`SearchBar` is fully built but disabled**, and even if re-enabled today its
   filtering logic wouldn't line up: `HomePage`'s (now-removed) filter handler
   checked `filters.location` and `filters.price`, but `SearchBar` collects
   `location`, `dates`, and `guests` — there's no `price` field at all. Someone
   needs to decide the real filter fields before wiring this back up.

2. **Two parallel sources of auth truth.** `Header.jsx` keeps its own `token`
   state (read from `localStorage`, synced via a `storage` event listener) while
   `AuthContext` separately tracks `storeUser`. Login/logout update both by hand.
   Worth consolidating into `AuthContext` exposing `token`, `user`, `login()`,
   `logout()`.

3. **`HostelDetails.jsx` — misleading fallback numbers.** `reviews.length || "12"`
   and `selectedHostel.averageRating?.toFixed(1) || "4.5"` show a hard-coded fake
   rating/review count when a property genuinely has none — reads as fabricated
   social proof. Should fall back to "No reviews yet" (the page already does this
   correctly in the empty-state branch further down; this one's just inconsistent
   with it).

4. **`Payments.jsx` — "Room Number" field doesn't affect the payload.** The unit
   actually charged comes from the `roomId` route param (`unitId: roomId`), but
   the visible "Room Number" input is bound to separate `unit`/`setUnit` state
   that's never sent anywhere. The "Property" input has the same disconnect for
   free-text edits. Needs a decision: make these read-only (they're meant to
   reflect a pre-selected hostel/room), or actually wire them into the payload.

5. **`LoginPage.jsx` — unguarded `error.error.includes(...)`.** If a request
   fails with a shape that doesn't include an `error` string (network failure,
   unexpected 500 body), this throws inside the `catch` block itself. Worth
   normalising API error shapes or guarding with `error?.error?.includes(...)`.

6. **`RegisterPage.jsx` — duplicate-check API called on every field blur.**
   `onBlur={handleBlur}` is on the whole `<form>`, so it fires (and calls
   `RegisterAjax`) whenever *any* field loses focus, not just email/phone. Scope
   it to those two inputs.

7. **`RegSuccessModel` / registration-token flow looks fragile.** The "success"
   screen shows based on `localStorage.getItem("token")`, but standard
   email/password registration doesn't appear to write a token to `localStorage`
   anywhere in `handleSubmit`. Worth tracing which flows actually populate
   `token` before relying on it to gate the success modal.

8. **Repeated page scaffolding.** `LoginPage`, `RegisterPage`, `Payments`,
   `RequestPasswordResetPage`, `ResetPasswordPage`, `ContactPage`, and
   `AboutPage` each hand-roll the same "gradient background + white/teal card"
   wrapper. A shared `AuthLayout`/`CardPage` component would cut duplication.

9. **Manual validation duplicated per page** (email/phone regexes, password
   rules) in `LoginPage`, `RegisterPage`, `RequestPasswordResetPage`, and
   `ResetPasswordPage`. Consider a shared `validators.js` or a form library.

10. **Hard-coded third-party image URLs.** `LoginPage.jsx` hotlinks an Unsplash
    photo; `RegisterPage.jsx` hotlinks a Google-hosted sample image. Neither is
    on your own CDN and neither reflects your actual brand.

11. **Dev tooling: `npm run build`/`npm run dev` can fail with a native-binding
    error on Windows.** The repo pins `"vite": "npm:rolldown-vite@7.2.5"`, which
    also requires Node `^20.19.0` or `>=22.12.0` (this machine has `20.15.0` —
    only a warning, not a hard blocker). The actual blocker was a one-off failed
    optional-dependency install (`@rolldown/binding-win32-x64-msvc` didn't get
    downloaded); a plain reinstall fixed it, no repo change needed. Still worth
    adding an `engines` field to `package.json` and a note in the README, so a
    fresh Windows contributor isn't left debugging a cryptic native-module error
    with no hint about the Node version requirement.

---

## Remaining lint output (for reference)

```
0 errors
5 warnings — react-hooks/exhaustive-deps (useIdleTimeout.js, PaymentHistory.jsx, Payments.jsx, TenancyAgreement.jsx, homepage.jsx)
```

All five warnings are the same shape: an effect that intentionally runs once
(`[]`) or on a specific trigger, calling a function that closes over a value not
listed in the dependency array. In each case, adding the missing dependency
as-is would change *when* the effect re-runs (e.g. `setStoreUser` in
`homepage.jsx`, or `resetTimers` in `useIdleTimeout.js`), so they need a
`useCallback`/`useRef` treatment rather than a blind dependency-array edit — left
as warnings rather than risking a behaviour change.

---

## Pre-commit lint hook

Added `husky` (devDependency of `frontend/campushostel-fe`) so `npm run lint`
runs automatically before every commit and **blocks the commit if there are any
errors** (warnings don't block, matching how `eslint`'s own exit code works).

Because the git repository root is two directories above `frontend/campushostel-fe`,
this isn't the default single-package husky setup — the hook lives at
`frontend/campushostel-fe/.husky/pre-commit`, and `core.hooksPath` is configured
to point at that folder specifically:

- `package.json`'s `"prepare"` script (`cd ../.. && husky frontend/campushostel-fe/.husky`)
  sets this up automatically for anyone who runs `npm install` inside
  `frontend/campushostel-fe`.
- The hook itself just does `cd frontend/campushostel-fe && npm run lint`, since
  git always runs hooks with the repo root as the working directory.

Verified both directions: a clean commit passes through, and a commit
introducing a real lint error (`no-unused-vars`) is rejected with
`husky - pre-commit script failed (code 1)` before it's created.

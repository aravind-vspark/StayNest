# Verification record

## Local verification after onboarding and mobile-source changes

- 23 Python tests passed using SQLite, including account deletion, access
  revocation, seeker conversion and native push outbox/tenancy checks.
- 12 frontend tests passed, including native API origin/cookie request options,
  account settings, browser checkout routing, filters and geolocation behavior.
- After localization: 18 JavaScript tests passed, including language selection,
  persistence, device defaults, storage failure, preserved form values and
  unchanged user content. The translation checker validates Hindi/Telugu pairs
  and parameter placeholders. Native device language layouts still need review.
- Native bridge JavaScript compiled successfully with esbuild.
- Capacitor generated and synchronized Android/iOS projects and five plugins.
- `pip check` passed; npm runtime audit (`--omit=dev`) reported zero vulnerabilities.
- Full npm audit reported four moderate findings in development-only build tools.
- Account-deletion migration applied to the backed-up local SQLite database.

Native Android/iOS binaries have not been compiled or signed. SDK/device tests,
cookie persistence on actual devices, FCM/APNs delivery, external checkout
handoffs, deep-link domain verification and store review remain unverified.
`npm run release:check` deliberately fails until the real domain, identifiers,
Firebase client configuration and final privacy disclosures are supplied.

## Original verification record

Verified in the supplied environment:
- Nine Python API tests passed with SQLite: account and owner scope, CSRF, tenant access, duplicate bed prevention, request progress, menu/notice visibility, QR rotation, invalid upload, invoice access, forged webhook rejection, captured payment idempotency, and push outbox.
- Three frontend render tests passed: real data discovery, tenant routes and escaped text, and owner tabs/editor.
- JavaScript syntax checks passed for app and service worker.
- Initial Alembic schema upgrade and development seed succeeded locally.
- Exact demo files remain in `prototype/`.

Limitations: Docker daemon, browser layout for the connected app, real PostgreSQL concurrency, actual gateway test transactions, and device Web Push were not available for end-to-end verification here. The included CI workflow runs the API suite with PostgreSQL; run it before release and add real provider/device tests in staging.

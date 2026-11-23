# StayNest — complete source package

This package contains the exact original StayNest browser prototype and a connected application built around the same design: green/cream styling, hostel cards, Explore/Tenant/Owner modes, tenant dashboard and owner workspace.

**Release status: tested implementation for staging and pilot deployment. It is not a certified, audited, or fully validated production release.** Read `docs/RELEASE_STATUS.md` before a public launch. Payment and Web Push adapters require real credentials and end-to-end staging validation. The app is a responsive web app/PWA; native Android/iOS store binaries are not included.

## Which folder should I use?

| Folder | Purpose |
|---|---|
| `prototype/` | Exact original HTML/CSS/JS from the published browser demo. Device-local sample data and simulated payments. |
| `web/` | Same visual design connected to the Python API; real sign-in, owner approval and shared database. |
| `backend/app/` | API, database models, permissions, payment adapter, push worker and operator CLI. |
| `backend/migrations/` | Versioned database schema; initial schema snapshot is independent of future model changes. |
| `backend/tests/` | Authorization, inventory, payment, QR, notification and operational tests. |
| `docs/` | Architecture, API reference, deployment, release boundaries and test evidence. |

The production UI necessarily differs from the demo in behaviour: you sign in, join a hostel by approval, and pay an issued invoice through a configured gateway. The role buttons change views; they never grant backend permissions. Fake reviews and artificial vacancy counts are not used in the connected app.

## Run the exact original demo

From the project root:

```sh
python -m http.server 8080 --directory prototype
```

Open `http://localhost:8080`. No database is needed. These files are byte-for-byte copies of the original delivered design. They must not be used for collecting rent or storing real tenant information.

## Run the connected application with Docker

Prerequisite: Docker with Compose.

1. Copy `.env.example` to `.env` (`copy .env.example .env` on Windows Command Prompt).
2. Replace `POSTGRES_PASSWORD` with a random hexadecimal value. Example generator:

```sh
python -c "import secrets; print(secrets.token_hex(32))"
```

3. Start the services:

```sh
docker compose up --build -d
```

4. Open `http://localhost:8000`.
5. To add persistent sample Hyderabad properties, owners and tenants, run the following **only in development**. Existing users are preserved. It asks for your own demo password:

```sh
docker compose exec api python -m app.manage seed-demo
```

Sign in as `owner@example.test` or `tenant@example.test` using that password. Seeding refuses to run with `APP_ENV=production`; it never runs automatically. Completed reruns leave existing records/passwords unchanged, and reserved-email collisions are rejected. See [demo sessions](docs/DEMO.md) for the full account list and walkthrough.

## Run with Python locally

Use Python 3.12. From the project root:

```sh
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell instead:
# .venv\Scripts\Activate.ps1
pip install -r backend/requirements.lock
# Explicitly opt into local development (PowerShell: $env:APP_ENV="development"):
export APP_ENV=development
cd backend
python -m alembic upgrade head
python -m app.manage seed-demo
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

With `APP_ENV=development`, defaults use SQLite, no Redis, and `http://localhost:8000`. Open that exact origin. Direct Python execution reads operating-system environment variables; it does not implicitly load `.env`. Compose does load `.env` and requires an explicit APP_ENV. An omitted APP_ENV defaults to production; unknown values fail startup. SQLite is rejected in production mode.

## Start with real properties

1. Register an account in the UI; select Owner and register a property.
2. Upload an actual property photo, add rooms/beds, and provide prices, address, location and terms.
3. A trusted operator verifies the owner outside the app, then runs:

```sh
docker compose exec api python -m app.manage approve-owner owner@example.com
docker compose exec api python -m app.manage publish PROPERTY_ID
```

4. In Owner → Tenants & QR, download the join QR and display it at reception.
5. Tenant scans, signs in and requests to join. Owner verifies the person and assigns an available bed.
6. Owner issues monthly invoices under Payments. Tenant pays only when collection is configured for that property.

The operator CLI is privileged deployment administration, not a public API. Keep it restricted to trusted administrators. `reset-password EMAIL` asks for a new password and revokes existing sessions; verify the requester before using it.

## Payment setup

Set `PAYMENT_PROPERTY_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Configure the gateway to send `payment.captured` events to `https://YOUR_DOMAIN/api/payments/webhook`. Enable automatic capture in your gateway settings and validate in test mode first.

A client success message never marks an invoice paid by itself. The API verifies the checkout signature and retrieves the payment from the provider, or validates a signed captured-payment webhook. Amount, currency and order must match the invoice. Receipts become available only after capture.

**Current merchant boundary:** online collection is enabled for one configured property/merchant. Other properties can manage invoices, but their online checkout is disabled. Do not route independent owners’ rents through one merchant account without an approved marketplace settlement integration. Multi-owner payout routing, deposits and refunds are not implemented in this release.

## Background notifications

In-app notices work without additional configuration and refresh every 30 seconds while the app is open. For optional background Web Push:

```sh
python scripts/generate_vapid.py
```

Save the generated pair securely in `.env`/your secret manager; set `VAPID_SUBJECT` to a real `mailto:` contact. Then:

```sh
docker compose --profile push up --build -d
```

Tenants opt in from Updates → Enable notifications. HTTPS and a browser supporting Web Push are required. Delivery uses a transactional outbox, retry/backoff and a separate worker. Each delivery rechecks active tenancy. Notification text is generic to avoid disclosing hostel information on a shared device. Devices may suppress or delay notifications; this is not an emergency alert service. No SMS/WhatsApp/FCM native SDK credentials are included.

## Tests

```sh
cd backend
python -m pytest -q
```

Tests reset the configured test database. Use a dedicated disposable database. To exercise PostgreSQL, set `TEST_DATABASE_URL` to a dedicated PostgreSQL database before starting pytest. CI provides one automatically. See `docs/TEST_REPORT.md` for what was actually run in this delivery.

## Deployment

See `docs/DEPLOYMENT.md`. The Compose stack includes PostgreSQL, Redis, API, one-shot migrations, optional push worker and Caddy for TLS. No secrets, user databases, uploads, virtual environments or generated demo passwords are included in the ZIP.

## Android and iOS source projects

`android/` and `ios/` contain Capacitor native projects sharing the web interface.
They include native location, notification registration, join links and sharing;
rent checkout opens the configured HTTPS website in the system browser.
Account deletion is available under Account on web and mobile.

Read [the mobile release guide](docs/MOBILE_RELEASE.md) before building. Configure
`mobile/release.json`, run `npm ci`, `npm run mobile:build` and `npx cap sync`.
The build requires a real HTTPS backend. Use Android Studio for Android and a
Mac with Xcode for iOS. `npm run release:check` lists missing release inputs.
Native source availability does not mean a signed build, device verification,
store submission or store approval has been completed.

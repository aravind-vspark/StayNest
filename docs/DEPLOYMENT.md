# Deployment runbook

## Local development

Use README commands. Docker Compose creates named volumes for PostgreSQL, media, Redis and Caddy. The default address is http://localhost:8000. Direct Python uses SQLite for convenience; production refuses SQLite.

## Production preparation

1. Provision a Linux host with Docker/Compose, a domain pointing to it, and ports 80/443 reachable. Keep PostgreSQL, Redis and API ports private. The Compose API has no host port binding.
2. Copy `.env.example` to `.env`. Set APP_ENV=production, APP_ORIGIN=https://your-domain.example and SITE_ADDRESS=your-domain.example. APP_ORIGIN must match the actual browser origin exactly. Set a long random hexadecimal POSTGRES_PASSWORD.
3. Store `.env` with restrictive permissions or inject secrets using your platform secret manager. Keep payment and VAPID secrets out of Git, logs and images.
4. Pin reviewed container image digests for reproducible production deployments. The supplied Docker image tags are convenient defaults, not immutable deployment approvals.
5. Run `docker compose up --build -d`. The migration service must succeed before the API starts. Caddy handles TLS for the configured domain.
6. Open the site, register a real owner, add the property, verify ownership and publish using the privileged CLI. Do not seed demo data in production.
7. Configure payments and optional push only after validating their provider test environments. Test browser refresh, two separate accounts/devices, receipt access denial, owner/tenant updates, and denied notification permissions.

## Upgrades

Back up first. Build and test the new image in staging. Review migrations; never alter an already-applied migration. Generate a new migration with `python -m alembic revision --autogenerate -m description`, review the SQL, then test upgrade against a restored database. Run the one-shot migration job once, then restart API and worker. Database schema rollback is not automatic; initial destructive downgrade is intentionally disabled.

## Backups

Example database backup (run from the project directory):

```sh
docker compose exec -T db pg_dump -U staynest -d staynest -Fc > staynest-backup.dump
```

Back up the media volume separately. Encrypt backups, restrict access, keep copies off-host and test restore regularly. Never use production personal data in developer test fixtures.

Restore into a NEW test database before any incident recovery:

```sh
docker compose exec -T db createdb -U staynest staynest_restore_test
docker compose exec -T db pg_restore -U staynest -d staynest_restore_test < staynest-backup.dump
```

Choose retention, recovery point and recovery time targets for your business. Existing database volume passwords are not changed by merely editing POSTGRES_PASSWORD; rotate the database credential deliberately and update clients together.

## Operations

- Monitor `/api/health` through an uptime monitor and alert on failures.
- Collect application/container error logs, database health, gateway failures, invoice ageing and failed push deliveries.
- Configure resource limits, disk alarms, log retention and database connection limits before real traffic.
- Periodically remove expired sessions and completed outbox records using a reviewed retention job.
- Inspect failed push deliveries; stale subscriptions do not delete themselves automatically.
- Reconcile captured payments and settlement reports against invoices daily during the pilot. Unknown gateway orders must be investigated.
- Order creation records a durable `payment.order.attempt` audit entry before contacting the gateway. Retries recover orders using the exact `staynest-INVOICE_ID` receipt and validate amount/currency. If a request failed before creating an order, retries intentionally remain blocked until a trusted operator confirms with the provider that no order exists. Only after that confirmation may the operator clear the corresponding attempt entry through a reviewed database operation; retain incident evidence. Do not clear it merely because one lookup returned no results.
- Captured-payment webhooks whose orders are not yet stored return 503 without marking the event processed. Monitor these failures, recover the order through the invoice order endpoint, and replay failed deliveries using the provider dashboard if automatic retries have expired.
- Former tenants retain access to Payments through `/api/invoices`; hostel services still require an active tenancy. Billing and owner history use 100-record pages. Owner summary totals are calculated separately from the selected history page. Public listings accept `offset` and `limit` (maximum 500) and fetch inventory in batches.
- Gateway webhooks bypass Origin checking but require the configured HMAC secret. Never disable signature validation to troubleshoot.
- The API trusts proxy headers because it is reachable only through the internal Compose network. Do not expose port 8000 directly in this setup or reuse that trust setting on a public interface.

## Account support

There is no automatic email/SMS verification or self-service password reset. A trusted operator must verify the requester's identity before running `python -m app.manage reset-password EMAIL`. This revokes sessions. Owner approval and publication are operator actions; a public administration dashboard is not included.

## Payment boundary

Use one approved property/merchant for this release. `PAYMENT_PROPERTY_ID` is a deliberate allowlist. Enable provider automatic capture. The webhook URL is `/api/payments/webhook` and the expected event is `payment.captured`. Use a separate webhook secret, not your API secret. Test mismatched amounts, retries, delayed captures and signed webhooks using the provider's test tools before live credentials.

For an open marketplace, implement and validate approved owner-specific merchant onboarding and payout routing before accepting their rents. Refunds/deposit settlement must currently be handled through a reviewed external operational process and reconciled; no refund button is supplied.

## Browser/PWA

The browser design is retained. A manifest and service worker allow supported browsers to install the app. The worker does not cache API responses or private pages. Offline operation is not promised. Web Push support and install flows vary by browser/platform; test real Android and iOS devices. Native app-store packaging and store submission are separate work.

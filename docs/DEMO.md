# Persistent demo sessions

Start with `powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1`.
Open http://localhost:8000. Data lives in `backend/staynest.db`; restarting
the server does not reset users or demo changes.

To seed a development database, from `backend`, set APP_ENV=development
and run `../venv/Scripts/python.exe -m app.manage seed-demo`. The command
prompts for a password of at least 12 characters (or uses DEMO_PASSWORD).
Use the local SQLite configuration; never point this command at live data.

The dataset includes six properties, three owners, twelve assigned tenants,
three prospects, 57 beds, 24 invoices, maintenance requests, menus, notices,
saved properties, enquiries and pending join requests. Dates are relative to
the initial seed date. They do not advance or reset on refresh.

Demo logins share the password supplied when initially seeded:

| Account | Use |
| --- | --- |
| owner@example.test | Green House and Nest Women's Residence |
| owner2@example.test | Urban Hive and Olive Living |
| owner3@example.test | Social Stay and Maple Boys Hostel |
| tenant@example.test | Assigned Green House tenant |
| tenant2@example.test through tenant12@example.test | Other assigned tenants |
| tenant13@example.test through tenant15@example.test | Prospects awaiting approval |

Use separate browser profiles or private windows for owner and tenant sessions.
Owner changes appear for the tenant on refresh or the normal polling interval.
Approve a pending join and assign a free bed to demonstrate onboarding.

New registrations are additional users. New owners register their own property;
operator approval/publication remains required. New tenants request to join
through a property's QR/link and require owner approval. No registration
automatically inherits a demo user's property or tenancy.

Seeding is explicit and transactionally additive. A completed seed rerun does
nothing: it does not reset passwords or overwrite demo/live changes. Existing
accounts using reserved demo emails cause an error before any fixtures are
created. Production mode rejects seeding. Concurrent seed attempts can yield
a uniqueness conflict; retry after the first transaction completes.

Demo listings and receipts are identified as samples. Historical paid invoices
are fixtures, not gateway transactions. Real payment creation is disabled for
seeded demo properties. Existing/new non-demo properties keep their normal
payment and authorization rules.

This dataset supports demos; it does not replace production integration,
security, concurrency, backup or gateway validation.

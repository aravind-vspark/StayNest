# One account from searching to moving in

The first-launch welcome screen requires sign-in or registration before the
browser UI opens. Registration saves one of three onboarding preferences:
`seeker`, `tenant` (already staying somewhere), or `owner`. This preference
chooses the starting screen; it never grants tenancy or ownership approval.
Public listing/join-preview API endpoints remain public.

Seekers compare properties, save favourites and arrange visits/enquiries.
After visiting, they scan the property's join QR or paste its join link in
the app. Their account shows pending owner approval. The owner verifies the
person and assigns an available bed. The same user then gains the tenant
dashboard, invoices, requests and announcements. Saved places and enquiries
remain attached to the same user ID; no second registration is needed.
Other pending property joins close when a room is approved.

While a seeker is browsing, the app checks account status every 30 seconds
when visible and idle; approval opens My stay. Signing in again also routes
an active tenant to My stay. Tenancy checkout removes hostel-service access
while keeping billing access. Owners with properties open their workspace;
new owner registrations start with property setup and still require operator
verification before publication.

The `0002` migration adds onboarding_intent with a seeker default for existing
users. Existing active tenancies and owned properties take routing precedence
over that preference. No existing user or property data is reset.

Use two browser profiles to demonstrate the flow: register a seeker, save a
property, submit an enquiry, then use its owner-provided join link. Approve
the request from the owner account and confirm the seeker's account ID,
shortlist and enquiries are unchanged after the tenant dashboard opens.

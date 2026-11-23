# Android, iOS and web delivery

## Current status

The repository contains Capacitor 8 Android Studio and Xcode projects and a
shared web UI. Native builds bundle the UI, not a remotely hosted WebView.
CapacitorHttp/CapacitorCookies connect to the configured HTTPS backend using
native HTTP and cookie storage. Native GPS is requested only after tapping
Use my location. Browser/PWA users keep browser geolocation and Web Push.

Native APNs (iOS) and FCM HTTP v1 (Android) subscriptions use the existing
transactional outbox, retry policy and active-tenancy checks. Provider keys
are server-only. Device tokens, cookie persistence, payment hand-offs and
notification delivery must still be tested on signed real-device builds.
This document is preparation for release, not evidence of store approval.

## Backend and public web

Deploy PostgreSQL, Redis, API, media, worker and HTTPS according to DEPLOYMENT.md.
Set APP_ORIGIN to the exact origin used by the mobile build. Mobile API
requests set that Origin and the existing CSRF request header; web CSRF
enforcement remains enabled. Never expose development SQLite or demo accounts
as the production marketplace. Keep the demo/reviewer environment separate.

Complete the pre-release privacy page with the operator's identity, support
contact, retention periods, backup deletion process and configured processors.
Publish `/privacy.html` and `/delete-account.html`. In-app Account settings
includes password-confirmed account deletion. Deletion removes session and
notification access and personal account fields, unpublishes owned listings,
ends tenancy and retains anonymized accounting/tenancy/audit references and
property business data. Those retained records do not have an automatic
purge schedule; the operator must define one before launch. This policy text
needs review for the actual business and deployment.

## Configuration and native assets

1. Install Node 22+ and run `npm ci` (set npm cache/TEMP to D: on this machine).
2. Copy mobile/release.example.json to mobile/release.json and fill the real
   HTTPS domain, support email, app identifier, versions, Apple team ID and
   Google Play **App Signing** certificate fingerprints (not only upload key).
   `com.staynest.app` is a working identifier, not proof of domain ownership
   or store-name availability. Rename both native projects properly if it
   changes; the build refuses mismatched Android identifiers.
3. Run `npm run mobile:build`, then `npx cap sync`. The build refuses localhost
   and `.example` backend origins. No production domain is invented by the
   source package. Do not ship platform assets generated before this step.
4. Run `venv/Scripts/python.exe scripts/generate-native-icons.py` to refresh
   launcher/splash assets from the existing brand icon. Review icon sharpness
   and all launch screens on devices before submission.
5. Deploy mobile/association-files contents at `https://DOMAIN/.well-known/`.
   Serve apple-app-site-association as application/json without redirects;
   serve assetlinks.json with the correct Play signing fingerprints. Configure
   the reverse proxy/static host explicitly for these extensionless files.
6. Run `npm run release:check`; it intentionally fails while release inputs
   and pre-release privacy text are incomplete.

Never put merchant secrets, APNs private keys, Firebase service-account JSON,
keystores or signing passwords in the mobile bundle or repository.

## Native notifications

Android: create a Firebase Android app for the exact application ID, enable
FCM v1, and place its google-services.json at android/app/google-services.json.
Set FCM_SERVICE_ACCOUNT_FILE on the API and worker to a server-only service
account file authorized to send messages for that Firebase project.

iOS: enable Push Notifications and Associated Domains for the App ID and
provisioning profile. The project references App.entitlements (development
APNs for Debug, production APNs for Release). Set APNS_KEY_FILE (.p8),
APNS_KEY_ID, APNS_TEAM_ID and APNS_TOPIC (bundle ID) on API/worker. Use
APNS_ENV=sandbox for development device tests; production for TestFlight and
App Store. Startup accepts a configured web or native push provider. Mount
credential files into both API and worker containers when using Compose.

Users opt in from Updates. The worker sends generic notification text,
checks active tenancy before delivery and stops retrying after five attempts.
Configure monitoring for failed deliveries and token cleanup. Android
notification channels and iOS notification forwarding are implemented.

## Android release

Install the Android SDK and JDK required by the generated Capacitor/Gradle
project. The generated target SDK is 36; confirm current Play requirements
when submitting. Android SDK/JDK are not installed/verified in this session.

Use `npm run android:open` to open Android Studio and test emulator/device
builds first. For a signed bundle, provide STAYNEST_KEYSTORE (absolute path),
STAYNEST_KEYSTORE_PASSWORD, STAYNEST_KEY_ALIAS and STAYNEST_KEY_PASSWORD through
your shell/CI secret store; never commit them. Run `android/gradlew.bat
bundleRelease` from the android directory (or `./gradlew bundleRelease` there).
The Gradle configuration refuses release tasks without signing inputs.

Upload the resulting AAB to Play Console's internal testing track, enroll in
Play App Signing and complete verification/testing requirements for your
developer account before requesting production access. Complete Data safety,
privacy/deletion URLs, content rating, permissions and reviewer access.

## Apple release

A Mac with the supported Xcode/iOS SDK and an enrolled Apple Developer account
is required. Run `npm ci`, configure the release, run mobile:build and cap sync
on that Mac, then `npm run ios:open`. Configure the signing team and verify
the bundle ID, entitlements and Release APNs environment. Review the generated
privacy manifest report, SDK privacy declarations and App Privacy answers.
Archive the Release build and upload it through Xcode Organizer to App Store
Connect. Test through TestFlight, then submit for review with working reviewer
accounts. Supply iPhone and iPad screenshots if supporting both device families.

## Release verification still required

Use real Android and iPhone devices to verify first-launch registration,
session persistence/revocation, seeker-to-tenant approval, GPS allowed/denied,
join links from camera and browser, owner photo upload, authenticated QR
display/sharing, external maps/phone links, checkout success/cancel/UPI-app
handoffs, receipt printing/sharing, push foreground/background/tap, account
deletion, network interruption, keyboard/safe areas and accessibility.

Native rent buttons open the HTTPS website billing screen in the system
browser, where the user signs in and uses the existing verified Razorpay
checkout. Returning to the app refreshes account/invoice state. Native
bank/UPI handoffs are not certified by this package; an embedded native SDK
must not replace this flow until its device flows pass staging validation.
Native store review is independent of
web test results. Store review may reject an insufficiently native experience.

The current npm audit reports four moderate findings in the Capacitor CLI's
development-only rimraf/glob/minimatch dependency chain. Runtime audit must
remain clean; review/update the build toolchain before public release rather
than forcing npm's suggested downgrade to an incompatible Capacitor major.

No store accounts, signing credentials, production domain or deployment have
been provided in this session. No signed AAB/IPA or public listing has been
produced or submitted. Store acceptance cannot be guaranteed by source code.

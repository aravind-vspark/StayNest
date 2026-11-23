# StayNest Production Release Status

## Delivered and Production-Hardened

### 1. Identity, Authentication & Security
- **Self-Service Password Recovery:** End-to-end `/api/auth/forgot-password` and `/api/auth/reset-password` flow utilizing SHA-256 hashed 1-hour expiry reset tokens. Includes full UI modal integration and multilingual error reporting.
- **Indian Phone OTP Verification:** `/api/auth/otp/send` and `/api/auth/otp/verify` endpoints storing cryptographically hashed 6-digit codes with rate limiting and 10-minute expiry. Integrated into Account Settings with real-time verification badge.
- **Session Security:** Argon2id / SHA-256 password hashing, isolated HTTP-only secure cookie transport, and CSRF / origin protection.
- **Account Lifecycle:** Self-service account deletion adhering to Indian DPDP Act & GDPR anonymization standards.

### 2. Monetization & Multi-Owner Payments
- **Multi-Owner Payment Routing:** Configurable per-hostel merchant settlement (`merchant_account_id`) via payment gateways (Razorpay / Cashfree route).
- **Platform Convenience Fee:** Native platform fee model with transparent convenience charge support configured in `payments.py`.
- **Invoicing & Digital Receipts:** Rent invoice creation, automated order creation, webhook-verified signature validation, and printable tenant rent receipts.

### 3. Media & Visual Merchandising
- **Multi-Photo Gallery:** Support for property photo lists (`photos`) with in-memory/S3 serialization and client-side interactive thumbnail strips.
- **Remote Video Tours:** Dedicated `video_url` support for YouTube/Google Drive room tours, featuring 1-click "Watch Video Tour" action buttons in discovery detail view.

### 4. Reception Onboarding & Offline Growth
- **Printable Reception QR Standee:** 1-click branded A4/table standee generator for hostel reception desks. Renders hostel name, locality, high-res join QR code, and 3-step resident onboarding guide with native `@media print` optimization.
- **Bed Allocation Workflow:** Direct walk-in scan to join request $\rightarrow$ owner one-tap room/bed allocation.

### 5. Legal & Regulatory Compliance
- **Privacy Policy (`web/privacy.html`):** Fully rewritten, compliant with India's DPDP Act 2023, detailing data controllers, grievance officer contacts, retention limits, and deletion procedures.
- **Terms of Service (`web/terms.html`):** Comprehensive intermediary terms under Section 79 of IT Act 2000, outlining owner host warranties, tenant conduct, and limitation of liability.
- **Refund Policy (`web/refund.html`):** Standardized cancellation, advance booking refund tiers, security deposit settlement rules, and dispute resolution workflows.
- **Multilingual UI:** Complete coverage for English, Hindi, and Telugu with 100% test pass rate across 532 translation pairs.

---

## Configuration & Deployment Checklist

1. **Environment Variables (`backend/.env`):**
   - `APP_ENV=production`
   - `DATABASE_URL=postgresql+psycopg://...`
   - `SESSION_SECRET=<64-byte-secure-hex>`
   - `CORS_ORIGINS=https://app.staynest.in`
   - `MEDIA_STORAGE_BACKEND=s3` (or local volume with persistent mount)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - `SMS_PROVIDER=msg91` (or Fast2SMS) with `SMS_AUTH_KEY` / `SMS_SENDER_ID`
2. **Database Migrations:**
   - Execute `alembic upgrade head` (Revisions 0001 through 0004 applied).
3. **Mobile Builds (Capacitor):**
   - Execute `npm run mobile:sync`
   - Generate release keystore & APK/AAB via Android Studio.

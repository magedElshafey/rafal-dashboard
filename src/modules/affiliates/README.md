# Affiliate dashboard slice (AFF-08 / partial AFF-09)

Implemented in the Staff Dashboard:

- `/dashboard/affiliates` responsive Affiliate listing
- URL-backed name/email/mobile/code search and status filtering
- server-driven infinite pagination
- create-Affiliate drawer with Saudi mobile, email, and code validation
- unreserved code suggestion with protection for manually edited values
- localized English/Arabic and RTL/LTR presentation

## Development mock

Run the shared mock project at `E:/freelance/rafal/rafal-affiliate-mock-api`, then configure the Dashboard locally:

```env
VITE_AFFILIATE_MOCK_API_BASE_URL=http://127.0.0.1:4100
VITE_AFFILIATE_MOCK_TOKEN=mock-staff-authorized
```

Restart Vite after changing environment variables. The route and sidebar entry are enabled only in Vite development mode when both variables are present. Affiliate requests use a feature-owned Axios instance; Laravel authentication storage and interceptors are not used or forwarded.

Contract: `E:/freelance/rafal/rafal-affiliate-mock-api/openapi.yaml` (Proposed — Pending Laravel Backend Confirmation).

## Known limitations

- Laravel endpoints and effective staff permissions are not available. Production routing remains disabled.
- The mock's authorization token is a development scenario selector, not production authorization.
- A code suggestion is not reserved; the create endpoint remains authoritative for Affiliate/coupon collisions.
- The successful response confirms account creation and backend initiation only, not actual SMS delivery.
- Editing, details, status actions, reset password, performance, exports, applications, settings, and payouts are intentionally deferred.

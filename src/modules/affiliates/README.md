# Affiliate dashboard management (AFF-07 / AFF-08 / AFF-09)

Implemented in the Staff Dashboard:

- `/dashboard/affiliates` responsive Affiliate listing
- `/dashboard/affiliates/settings` Affiliate Programme Settings
- `/dashboard/affiliates/:id` responsive Affiliate details and management history
- URL-backed name/email/mobile/code search and status filtering
- server-driven infinite pagination
- create-Affiliate drawer with Saudi mobile, email, and code validation
- unreserved code suggestion with protection for manually edited values
- localized English/Arabic and RTL/LTR presentation
- profile editing with partial PATCH payloads and read-only code/status
- confirmed suspension, reactivation, and password-reset initiation
- safe chronological management activity without raw audit JSON or employee claims
- explicit settings saves with changed fields plus the last-read version
- safe settings conflict review that preserves the draft, reloads current values, and requires an explicit retry

## Development mock

Run the shared mock project at `E:/freelance/rafal/rafal-affiliate-mock-api`, then configure the Dashboard locally:

```env
VITE_AFFILIATE_MOCK_API_BASE_URL=http://127.0.0.1:4100
VITE_AFFILIATE_MOCK_TOKEN=mock-staff-authorized
```

Restart Vite after changing environment variables. The route and sidebar entry are enabled only in Vite development mode when both variables are present. Affiliate requests use a feature-owned Axios instance; Laravel authentication storage and interceptors are not used or forwarded.

Contract: `E:/freelance/rafal/rafal-affiliate-mock-api/openapi.yaml` (Proposed — Pending Laravel Backend Confirmation).

Management uses `GET/PATCH /dashboard/affiliates/:id`, the `suspend`, `reactivate`, and `reset-password` POST
actions, and `GET /dashboard/affiliates/:id/activity`. Mutations invalidate only affected list, detail, and activity
queries and use authoritative responses for visible profile state.

Settings use `GET/PATCH /dashboard/affiliate-settings`. The complete GET/PATCH DTO contains the two programme
flags, two percentage values, the exact minimum-payout decimal string, terms-page slug, `version`, and `updated_at`.
PATCH sends `version` plus changed fields only. A `409 AFFILIATE_SETTINGS_VERSION_CONFLICT` preserves the local
draft, refetches the authoritative DTO for review, and never retries until the staff member explicitly confirms.
The returned complete DTO replaces only the settings cache and becomes the next accepted form baseline.

Focused tests:

```sh
node node_modules/vitest/vitest.mjs run src/modules/affiliates
```

## Known limitations

- Laravel endpoints and effective staff permissions are not available. Production routing remains disabled.
- The mock's authorization token is a development scenario selector, not production authorization.
- A code suggestion is not reserved; the create endpoint remains authoritative for Affiliate/coupon collisions.
- The successful response confirms account creation and backend initiation only, not actual SMS delivery.
- The mock stores settings but does not enforce them in storefront checkout, applications, commissions, or payouts.
- Production currency, commission basis, terms-page existence, Laravel endpoints, and final permissions remain pending decisions.
- Commission performance, orders, exports, applications, payouts, code rotation, and analytics are intentionally deferred.

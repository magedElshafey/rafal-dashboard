# Affiliate Laravel integration

The module targets the approved EPIC-11 Laravel guide (2026-11-24), using the existing shared `$http`, staff session, TanStack Query and EN/AR resources. Configure the normal API base ending in `/api/v1`; services append `/dashboard` once. No feature token, second Axios client, Mock fallback or activity endpoint remains.

All Affiliate production and development routes remain disabled until an authoritative effective-staff-permissions source and per-endpoint policy are supplied. Payout readiness is separately closed. Do not enable a flag as a substitute for implementing permission hydration, route/query/mutation checks and staging acceptance. Role names and the permissions catalog are not grants.

Implemented local contracts and UI:

- Settings GET and full six-field PUT mapping, documented percentage/range validation, published-page selector, draft preservation and programme-disable confirmation. Save is explicitly closed pending settings/page-access clarification.
- Affiliate list pagination, URL search/status, source/order counts and exact Backend money strings; CSV export uses shared transport/download utilities.
- Creation uses canonical Saudi phone/account_handle and optional code; actual SMS false is shown without repeating creation. Generator response is not assumed; manual/backend-generated code is the fallback.
- Profile PUT, reason-based suspend/reactivate, confirmed reset with actual SMS outcome; date-range detail reads, source/application/login/terms metadata. Partial mutation results never replace full detail caches.
- Application list/detail, authoritative pending count, customer context, chosen-code approval, rejection reasons and 409 reconciliation. Decision metadata is displayed without an invented timeline.
- Payout list and minimal detail/balance warning are read-only. Financial decisions, exact banking/detail enrichment and date rules await confirmation.
- Order attribution and coupon collision feedback reuse their existing modules and shared components.

Missing nested Affiliate financial DTOs and `meta.totals` keys prevent complete financial summary/detail rendering. Unknown optional sections are omitted, never populated with synthetic values. Response parsers validate consumed fields only; successful synthetic tests are not evidence of deployed Laravel compatibility.

Read the active blockers and consolidated missing-information handoff under `docs/affiliate-integration-audit/10_ACTIVE_BACKEND_BLOCKERS.md` and `11_CONSOLIDATED_BACKEND_MISSINGS.md` before the next integration step. No live Backend mutation was performed.

Focused tests: `node node_modules/vitest/vitest.mjs run src/modules/affiliates --maxWorkers=2 --minWorkers=1`. If the local NVM shim hangs, use the already installed runtime described in `09_TOOLING_BASELINE.md`. Dependencies were restored from the existing lockfile, without upgrades.

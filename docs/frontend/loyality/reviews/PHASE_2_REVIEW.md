# Phase 2 Customer Points and Ledger Review

## Scope

Source-level and regression review of Customer Details Points navigation, summary, read-only ledger, URL filters, query isolation, error independence, accessibility, RTL, and request counts.

## Implementation summary

- Confirmed URL-backed Overview/Points tabs, direct-link and Back/Forward behavior.
- Confirmed ordinary Overview visits issue no loyalty requests and direct Points visits issue no customer-orders request.
- Confirmed customer/filter-scoped query keys, supported server filters, independent summary/ledger boundaries, read-only ledger, and RTL-safe signed values.
- Corrected one demonstrated issue: a nullable `expiring_soon` was displayed as a fabricated zero. It now displays a localized unavailable state.

## Files changed

- `src/modules/loyalty/components/CustomerLoyaltySummary.tsx`
- `src/modules/loyalty/locale/en.json`
- `src/modules/loyalty/locale/ar.json`
- `src/modules/customers/pages/CustomerLoyaltyPage.test.tsx`

## Test results

- Focused Phase 2 suite: 3 files, 22 tests passed.
- Changed-file ESLint and Prettier check: passed.

## Known issues

- Only `adjust_credit` is exposed as a ledger filter because it is the sole documented filter value.
- Ledger `page`/`per_page` support is confirmed and implemented. The non-null order shape, complete transaction enum, date semantics, and CSV export remain undocumented.
- Deleted-customer and notification behavior require backend verification.

## Review outcome

Checkpoint passed with the nullable expiring-soon correction. No critical regressions or duplicate-request paths remain in the reviewed implementation.

## Remaining work

Implement the documented manual adjustment workflow and verify its exact cache lifecycle.

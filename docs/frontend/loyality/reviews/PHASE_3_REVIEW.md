# Phase 3 Manual Loyalty Adjustments Review

## Scope

Manual credit and debit adjustments from the existing Customer Details Points workspace, limited to the documented adjustment contract.

## Implementation summary

- Added a localized, responsive adjustment dialog using the existing form and Radix dialog components.
- Supports the documented `credit`/`debit` types, `customer_service`/`other` reasons, integer points from 1 to 100,000, a 10–250 character internal note, and an opt-in customer notification request.
- Shows the authoritative available balance and frozen-customer context. A known over-balance debit is rejected locally; the backend remains authoritative when the balance is unavailable or changes concurrently.
- Serializes the exact API request shape and preserves note content while validating its trimmed character count.
- Prevents re-entrant submissions, retains form state on failure, maps Laravel validation errors, and restores focus to the trigger on close.
- On success, writes the returned summary to the exact customer cache and invalidates only that customer's active ledger queries. It does not optimistically change financial data or fabricate ledger rows.

## Files changed

- `src/modules/loyalty/types/loyalty.types.ts`
- `src/modules/loyalty/api/loyalty.service.ts`
- `src/modules/loyalty/api/loyalty.service.test.ts`
- `src/modules/loyalty/schemas/loyalty-adjustment.schema.ts`
- `src/modules/loyalty/schemas/loyalty-adjustment.schema.test.ts`
- `src/modules/loyalty/hooks/useAdjustCustomerLoyalty.ts`
- `src/modules/loyalty/hooks/useAdjustCustomerLoyalty.test.tsx`
- `src/modules/loyalty/components/CustomerLoyaltyAdjustmentDialog.tsx`
- `src/modules/loyalty/components/CustomerLoyaltyWorkspace.tsx`
- `src/modules/loyalty/components/CustomerLoyaltySummary.tsx`
- `src/modules/loyalty/locale/en.json`
- `src/modules/loyalty/locale/ar.json`
- `src/modules/customers/pages/CustomerLoyaltyPage.test.tsx`

## Components reused

Existing `Dialog`, `Button`, `FormWrapper`, radio, input, select, textarea, checkbox, Laravel validation mapping, API error helper, Axios client, TanStack Query client, query keys, toast, and i18n infrastructure.

## Test results

- Phase 3 focused suite: 4 files, 38 tests passed.
- Changed-file ESLint and Prettier check: passed.
- `tsc --noEmit`: passed.

Coverage includes validation, exact serialization, credit/debit, notification default and opt-in, blocked-customer context, over-balance debit, Laravel/network failures, duplicate prevention, cache update, active/inactive ledger freshness, customer-isolated invalidation, URL-filter preservation, focus return, and English/Arabic direction.

## Known issues

- Only two reason codes are documented; the other two business reasons are not rendered or sent.
- The API has no documented related-order field.
- Notification delivery, credit-lot expiry, audit creation, atomic debit enforcement, and frozen-balance behavior are backend responsibilities not proved by the success envelope.
- Deleted-customer response and adjustment eligibility are undocumented.

## Review outcome

Checkpoint passed. Supported financial behavior is conservative and backend-authoritative, cache reconciliation is customer-scoped, and no additional read requests or optimistic financial writes were introduced.

## Remaining work

Human browser smoke testing and backend clarification/verification recorded in `BACKEND_HANDOFF.md`.

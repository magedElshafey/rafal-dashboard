# Active Laravel integration blockers

2026-11-26. Messages are **READY TO SEND — NOT SENT**. No communication channel has been authorized. Existing approved guide extraction is used; no fresh PDF verification or live Backend requests.

## B01 — Effective staff permissions

- Task: T02 and protected Affiliate feature exposure.
- Endpoint: existing staff `/dashboard/auth/login`; effective-grants source unknown.
- Missing: authoritative effective permission names, envelope, Super Admin semantics, refresh/revocation policy.
- Impact: role names and assignable catalog cannot authorize protected reads/writes. All Affiliate routes remain closed, with no development bypass.
- Implemented: shared staff transport, auth-epoch fences, exact-name policy with all 16 synthetic grant subsets tested, and service/query/route closure. Effective-grants hydration and runtime per-action policy remain unfinished; changing a flag is not a valid activation procedure.
- Required response: sanitized source/envelope and refresh contract, plus exact middleware for list/detail/create/generator/export/application reads.
- Status: OPEN.

**Urgent Backend message:** Please provide the supported current-staff effective-grants source and sanitized response, including refresh/revocation behavior and exact permission requirements for Affiliate list/detail/create/generate/export and application reads. We cannot expose these routes using roles or the permissions catalog. Integration code and synthetic tests will proceed with protected routes closed.

## B02 — Settings special cases and page authorization (narrowed)

- Date: 2026-11-26. Task: settings activation; GET/PUT /dashboard/affiliate-settings and GET /dashboard/pages.
- Evidence: the guide documents the six-field PUT, numeric min_payout, positive terms_page_id and published-page requirement. The ordinary non-null case is implemented and tested; null/clear ambiguity does not block this contract.
- Missing: null/clear behavior only when no valid terms page is selected, and authoritative access to published-page options for settings-only staff. Additional decimal precision beyond the documented numeric case remains a nonblocking question.
- Impact: the UI must not silently clear a page or use ID 0; settings-only staff must not be given guessed page access.
- Implemented: complete PUT mapping; numeric zero/range cases, positive published-page selection, dirty drafts/discard and disable confirmation. Absent/unpublished selection cannot save. No Mock version field.
- Disabled: all protected production access remains closed by B01. The settings write readiness gate also stays false pending authorization/page-access and controlled staging verification, not because the entire documented settings contract is unknown.
- Required response: exact settings-only page-access policy; null/clear semantics for that optional special case. The numeric non-null request does not require reconfirmation.
- Status: OPEN, narrowed to special cases/access; ordinary request mapping implemented awaiting Laravel verification.

**Backend message — READY TO SEND — NOT SENT:** The documented numeric minimum payout and non-null published terms-page PUT is implemented. Please confirm published-page lookup access for staff holding only affiliates.settings.manage, and the intended handling when terms_page_id is null or needs clearing. We currently prohibit unset/unpublished selections. Staff grant hydration and authorized staging verification remain prerequisites to activation.

## B03 — Complete detail and decision results

- Tasks: T05 full financial detail and T07 sensitive payout decisions.
- Endpoints: Affiliate detail and payout detail/paid/reject.
- Missing: exact nested financial/detail DTOs, financial decision result envelope and transfer-date timezone.
- Impact: unsafe to invent balances, replace rich detail with partial data, expose unverified banking fields, or report financial success from an unknown result.
- Implemented: minimal Affiliate detail, profile/status writes parsing the common success envelope then refetching, actual reset SMS outcome, application approval using documented Affiliate ID/SMS and rejection using the success message with 409 reconciliation. Payout list/minimal detail and balance warning are implemented. Paid/reject forms, request schemas, service methods, duplicate locks, draft preservation and 409/cache reconciliation are now prepared behind the independent closed isAffiliatePayoutDecisionReady gate. Date defaults to the browser-local calendar day in this closed UI; no timezone conversion is applied to the date-only payload. Full IBAN stays within the closed payout workflow, never persisted or logged.
- Disabled: live financial decision activation and unknown financial/bank detail sections; all protected exposure also blocked by B01. Application decisions no longer have an independent DTO blocker, but await B01 and Laravel verification.
- Required response: sanitized representative envelopes, including null/empty, SMS false and already-decided conflicts; synthetic IBAN only.
- Status: OPEN.

**Backend message:** Please provide complete Affiliate financial/detail and payout detail/paid/rejected envelopes with synthetic banking data, plus the timezone governing date-only transferred_at and its future-date rule. Live financial decisions and unknown financial sections remain disabled. Prepared methods validate only the common acknowledgment and refetch authoritative state; they do not claim a completed payment or update balances. Activation additionally requires verified financial result semantics and controlled staging acceptance. Application decisions now consume the documented minimal result and await authorized staging verification and B01. No timed-out decision is automatically replayed.

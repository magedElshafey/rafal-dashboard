# Backend questions and production QA

This audit has not called Laravel endpoints or tested SMS delivery. Questions below concern information genuinely absent or ambiguous in the supplied guide. They do not reopen documented decisions such as separate Affiliate auth, full settings PUT, four permission names, phone/account_handle naming, or 10–250-character rejection reasons.

## Questions and decisions

| ID | Owner / priority | Unresolved point and evidence | Required answer / unblock |
| --- | --- | --- | --- |
| Q01 | Backend/Auth, release blocker | Staff login/session source currently contains roles only; guide p.7 defines permission names but no effective-grant response. Existing auth notes say no staff /me | Supported source/envelope for current effective permission names, Super Admin semantics, grant refresh/revocation policy and session upgrade. Do not assume /me or derive grants from catalog |
| Q02 | Backend, release blocker per route | §4 explicitly gives settings read/write, M management decisions and P payouts, but not complete route middleware | Exact permission per list/detail/create/generate/export/application-read endpoint; whether M implies V; P-only access to payout identity and S-only access to settings/page options; behavior of Order→Affiliate link without V |
| Q03 | Backend/Product, settings blocker | p.1 money-as-string vs p.8 numeric min_payout; no complete settings GET/PUT result example | Exact GET/PUT scalar types, min_payout decimal precision, terms_page_id nullable/clear behavior and response after PUT. No version is documented; clarify last-write semantics only if concurrency protection is needed, without retaining old mock protocol |
| Q04 | Backend, settings-selector blocker | Guide requires published-page list. Current service serializes is_published/search/sort while old integration notes say pagination only | Confirm supported page query/filter/pagination and access for S-only staff. If filter unsupported, consume paginated existing list and locally exclude unpublished records; decide how current unlisted/unpublished selection is handled |
| Q05 | Backend, DTO blocker per slice | §4.2 detail is described in prose, generator response absent; application/payout samples incomplete | Redacted concrete envelopes for generator, detail/period/balances/orders/payouts, profile/status writes, approval/rejection and application decided_by. Confirm nullability, nested pagination, date-range defaults/limits, Index totals filter scope, accepted page sizes, app page size; CSV content headers/columns/encoding |
| Q06 | Backend, management blocker | §4.2 suspend explicitly10–250; reactivate shows reason but no repeated bound; staff platform/handle validation incomplete | Reactivate reason length, status-action conflict response/status and actual staff name/email/platform/account_handle rules; which response is complete enough for cache replacement |
| Q07 | Product/Backend, history scope decision | Guide supplies no Affiliate/application activity endpoint; mock adds /activity and fake staff actor | Is full staff history a required release feature? If yes supply endpoint/permission/event/actor/redaction/order contract; otherwise approve exclusion and application decision-metadata display only. Do not fabricate events |
| Q08 | Backend/Product, payout blocker | §4.4 says list exposes full IBAN and detail returns payout without full DTO; date cutoff timezone unspecified | Exact list/detail IBAN fields and intended access, pagination keys, mutation result DTOs, authoritative timezone for future-date validation, and permitted reconciliation after ambiguous network success |
| Q09 | Backend/QA, verification | p.1 X-Locale and ready Arabic copy; current client sends different locale headers | Confirm precedence and EN behavior of X-Locale, including backend-provided messages/status labels. Audit extraction omitted Arabic glyphs; review rendered PDF copy before sign-off |
| Q10 | Product/Architecture, external workstream | pp.1,4–7 separate Affiliate Panel auth/app required; no panel here | Ownership and separate app versus isolated area, deployment/URL, token isolation. Not a prerequisite to writing Dashboard audit or implementing documented staff slices |

Full IBAN visibility is documented for the staff payout resource; the exact list/detail distinction is what remains unclear. Do not ask whether payouts need protection or whether affiliates share staff tokens: the guide already answers both.

No additional Website/Backend repository is needed to complete this audit. Runtime verification can use authorized staging accounts and redacted responses when those are available.

## Contract verification strategy

1. Agree on the actual staging base including /api/v1. Use the current staff login flow and authorized role-specific test accounts. Do not copy tokens into feature code, docs, screenshots or logs.
2. Obtain redacted authoritative examples for missing DTOs. Label synthetic fixture construction explicitly; a fixture is not proof of runtime validation or middleware.
3. For each E01–E19 contract, assert method/path/query/body/envelope/types, permissions,422/409 semantics where specified, and business side effects. Confirm404/429 behavior rather than inventing it.
4. Execute reads before controlled writes. Creation/approval/reset/reject can send SMS; paid/rejected payouts are terminal financial decisions. Use designated staging records and authorized test numbers, never the PDF recipe as authorization to retrieve passwords.
5. Record request metadata and sanitized status/outcome only; exclude Authorization, generated passwords, bank data and raw sensitive payloads.
6. Compare actual failures to guide; distinguish backend deviations from frontend gaps. Do not mask an unexpected backend response with a legacy compatibility fallback.
7. Run browser verification against real staging after service/RTL tests. Successful mocked HTTP tests cannot certify cross-token denial, atomic decisions, uniqueness, commission jobs or SMS delivery.

## Regression test matrix

| Area | Required scenarios | Evidence / expected result |
| --- | --- | --- |
| Transport | Composed /api/v1/dashboard path; real staff token; Accept/X-Locale; abort | Single shared client, no mock host/token or copied session owner |
| Authorization | None/V/M/S/P and meaningful combinations; unknown grants; revoked grants; Super Admin | Correct route/nav/actions, no unauthorized requests, backend403; no role-name shortcuts |
| Token realm | Staff token on Affiliate Panel and Affiliate token on Dashboard |401 per guide; no token crossover or session reuse |
| Auth/cache boundary | Logout/login or401 during pending query/mutation; cross-tab sync | Old cache/data not reintroduced;401 only affects matching current session |
| Settings read | V-only, S-only; all fields; terms_page metadata; null cases as confirmed | Disabled readonly controls/no save; stable skeleton and precise DTO |
| Settings write | All six fields, unchanged included; no PATCH/version; bounds and precision | Correct PUT, min0 allowed, discount1–50, commission0.5–50; no third percentage decimal |
| Programme effects | Enabled→off cancel/confirm; applications flag; terms-page change | One PUT on confirm; effects explained; payout/sign-in remain possible, reacceptance message |
| Static-page selector | Several pages, no published records on first page, selected record outside loaded set,403/error/retry | Complete accessible selection, no premature empty result or unsupported filter assumption |
| List | Active/suspended/search/page25 policy; empty/loading/retry; source/count/balances/totals | No profile-only required keys, no sum over current pages; filtering preserved |
| CSV | Same filters; successful blob; JSON error in failed download; cancel/repeated click | Correct file and cleanup, one request; no empty fake success |
| Generate/create | Name change races, typed code retained, blank optional code, boundaries, all Saudi inputs | Canonical phone/account_handle; generator response confirmed;422 conflicts inline |
| Account/SMS | Create/approve/reset sms_sent true/false and message; ambiguous timeout | Successful account not recreated; manual reset suggestion; no password exposure or automatic retry |
| Details | Date ranges/defaults, query keys, source/application navigation, masked bank, login/terms, orders/payouts | Authoritative full detail, null handling, no full IBAN on general Affiliate view |
| Profile | Sparse writable PUT, immutable code/status, email changes login, server422 | Draft preserved; partial result never replaces complete financial detail |
| Status actions | Reason required; suspend10–250; confirmed reactivate rule; repeated clicks/stale state | One action, appropriate follow-up, no old mock code dependency |
| Password reset | Cancel/confirm, pending lock, backend failure, SMSfalse | No-body POST with correct result; no generated password |
| Activity | Real endpoint only if agreed; missing contract path | No /activity request or fake actor when unsupported; decision metadata not full audit |
| Applications | Oldest-first list/status/page, pending_count, nested customer, followers/application fields | No fabricated summary or pending count from loaded rows |
| Approval | proposed_code, unavailable suggested message, edited code,422 collision, SMSfalse | Backend-created Affiliate ID returned/linked; no repeated approval |
| Rejection |9/10/250/251 characters, empty; SMS/message; terminal record |10–250 enforced, persisted reason shown, controls hidden after decision |
| Decision race | Two staff approve/reject same application or payout |409 surfaced, exact record/list refresh, no automatic replay; query refresh rather than browser reload |
| Payout security | P-only/no-P, direct links, full IBAN, logout and stale cache | Sensitive fields only in authorized payout area; no persistence/URL/log/analytics leak |
| Payout rules | Warning after refund, negative balance, reference2/3/50/51, date today/future | Warning displayed without inventing automatic payment prohibition; valid reference/nonfuture date |
| Payout transitions | pending→paid/rejected, already final, network ambiguity | Final buttons hidden,409 refresh; authoritative balances, no optimistic arithmetic |
| Order attribution | Absent/null/present block, status, negative adjustment, link permission | Snapshot values displayed; amount/rate/base/discount accessible to keyboard/touch |
| Existing Orders | Gift, loyalty, nullable party data, status transition response | No schema/normalizer/cache regressions; affiliate survives authoritative detail updates |
| Commission lifecycle | Pending→approved; cancellation; approved return with negative adjustment | Display backend status; no client scheduler or recalculation |
| Money | SAR/ex-VAT, decimal strings, large values, zero/negative/-0.50 | Exact sign/precision; no inferred VAT or commission; signed formatter regression |
| Coupons | Create/edit422 code collision, correction/resubmit, normal duplicate | Backend message inline as escaped text; draft preserved; no preflight calls |
| Roles | New four catalog entries, dynamic labels, exact permission-name writes | No hardcoded groups or catalog-as-current-grants assumption |
| UI quality | EN/AR parity, RTL/bidi,360px/tablet/desktop, keyboard/dialog focus/errors/loading | Real browser and visual checks recorded; unit class assertions not called visual review |
| Removal/release | Runtime import/string scan, gate matrix, production bundle | No mock transport/credentials/provisional DTO assumptions; tests retained/adapted |

Guide p.10 §5 is display-only: order placement stores snapshot; confirmation pending; delivery plus closed return window/no open return request leads to approved via backend daily job at02:00 Riyadh; cancellation/return before approval cancelled; return after approval keeps approved with negative adjustment and can produce negative balances. These are backend behaviors to verify in staging, not frontend timers or calculations.

## Staff authorization acceptance matrix

Pending exact route middleware confirmation (Q02), use this intended policy and test against backend:

| Staff capability | Settings read/write | Affiliate/application reads | Create/edit/status/reset/decisions | Payouts |
| --- | --- | --- | --- | --- |
| No Affiliate grants | Deny/deny | Deny | Hide/deny | Deny |
| V only | Readonly/deny | Allow | Hide/deny | Deny |
| S only | Allow/allow | No assumed V | Hide/deny | Deny |
| M only | No assumed V/S | Confirm read prerequisite | Allow only confirmed routes; never imply V | Deny |
| P only | No assumed V/S | No general-read implication | Deny | Allow payout list/detail/process and documented nested identity |
| V+M | Readonly/deny | Allow | Allow | Deny |
| V+S | Allow/allow | Allow | Deny | Deny |
| V+M+S+P | Allow/allow | Allow | Allow | Allow |
| Super Admin | Per backend effective grants | Per backend effective grants | Per backend effective grants | Per backend effective grants |

For every row test sidebar, direct URL, query enablement, mutation affordance and direct authorized staging API attempt. A frontend denial is UX; backend denial is security.403 must not clear a valid staff session.

## Release-readiness checklist

- [ ] Q01/Q02 effective-permission and endpoint policy resolved.
- [ ] Consumed DTO fields/nullability/mutation completeness verified; no old required mock fields.
- [ ] All enabled E01–E19 operations and cross-module changes meet acceptance criteria.
- [ ] Programme PUT, published terms, read-only and shutdown confirmation verified.
- [ ] Financial data remains authoritative, signed, precise and correctly scoped.
- [ ] SMS results shown honestly; credentials never exposed.
- [ ] Application/payout409 conflicts refresh affected queries without replay.
- [ ] Sensitive IBAN confined to authorized payout surfaces and cleared with identity.
- [ ] Existing Orders/Coupons/Static Pages/Roles integrations preserved.
- [ ] Runtime mock client/config/token/scenario/notice/provisional contract removed after replacement.
- [ ] Existing meaningful tests retained with real-contract fixtures; new missing-workflow tests pass.
- [ ] Scoped format/lint/tests/types pass; release build and directly affected regressions pass.
- [ ] Authorized real staging contract/denial/side-effect tests recorded.
- [ ] EN/AR, RTL,360px, keyboard/focus and loading/error states visually checked.
- [ ] Arabic PDF copy visually reviewed; extracted missing glyphs not reconstructed by guess.
- [ ] Explicit readiness/rollback decision; no fallback to fake transport.
- [ ] External Affiliate Panel ownership tracked separately; no shared staff token.
- [ ] Evidence-backed GO recorded; remaining enabled-workflow P1 blocks release.

## Audit validation evidence

- Initial `git status --short`: only ` M .env.example`.
- Initial diff: line1 changed from empty VITE_API_BASE_URL to https://api.rafal.shop/api/v1. The two mock example settings were already present. This user change was not modified.
- `git rev-parse --show-toplevel`: D:/personal-projects/rafal-dashboard.
- `pdftotext -layout` read the entire supplied PDF,11 pages. Arabic copy extraction was incomplete. Python executable was inaccessible; alternate Desktop Commander PDF tool had no online device. These did not prevent reading English API contracts.
- Source searches and file reads performed for all existing Affiliate pages/services/schemas/hooks/forms plus relevant auth/roles/routes/navigation/order/coupon/settings/static-page/shared infrastructure and test files.
- Baseline command attempted: `node node_modules/vitest/vitest.mjs run src/modules/affiliates --maxWorkers=2 --minWorkers=1`. It exited **1 with no diagnostic output**. No test pass count is claimed; runtime/test baseline remains unverified.
- No live Laravel request, browser E2E, screenshot/viewport/visual review, production build or application lint/typecheck was run during the audit.
- Document structural/reference validation passed: exactly six Markdown files with titles, 19 endpoint rows, 20 gap records and 11 task records. Explicit `src/...:line` references were checked for file existence and line bounds; local Markdown links resolved, with zero reference issues. Abbreviated references are defined in the matrix and were reviewed against inspected source.
- `git diff --check` passed for the tracked diff. A separate document whitespace check covers the new untracked Markdown files; application behavior is not certified by these checks.
- Changed-document formatting command attempted: `node node_modules/prettier/bin/prettier.cjs --check docs/affiliate-integration-audit/*.md`. It exited **1 with no formatter diagnostics**; Prettier compliance is unverified, not reported as passing.
- Final `git status --short --untracked-files=all`: the pre-existing modified `.env.example` plus exactly the six new audit documents. `git diff --numstat` remained `1 1 .env.example`; no tracked source or test changes.

## Artifact set and safety

Only these six files are new:

1. EXECUTIVE_AUDIT.md
2. CURRENT_ARCHITECTURE.md
3. BACKEND_CONTRACT_GAP_MATRIX.md
4. MOCK_REMOVAL_PLAN.md
5. IMPLEMENTATION_ROADMAP.md
6. BACKEND_QUESTIONS_AND_QA.md

No production source/test/dependency modification, mock deletion, commit, push, external write or secret retrieval was performed. User's pre-existing .env.example change remains. Git emitted a warning that the global ignore file under C:/Users/geexar/.config/git/ignore was inaccessible; repository status/diff still returned. Ignored private environment contents were intentionally not read.


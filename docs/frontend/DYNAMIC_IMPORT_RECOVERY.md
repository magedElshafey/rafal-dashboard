# Dynamic import recovery on Vercel

## Incident and confidence

The reported `/dashboard/pages` failure referenced
`/assets/StaticPagesPage-I0qd2vSX.js`. The user observed a direct 404, while
Incognito and a cache-disabled hard reload succeeded. These are user-supplied
observations, not independently repeated production checks.

Deployment version skew is the leading explanation: an already-running entry
bundle requests an old hashed chunk after the production alias moves to a newer
build. The historical deployments and response headers were not available to
prove that exact transition. Connectivity, blocked requests, and asset routing
can also cause import failures. HTML caching alone is not a proven cause.

A direct production check on 2026-10-14 found that the route HEAD response was
200 HTML with `Cache-Control: public, max-age=0, must-revalidate`. A GET to the
historical chunk URL returned **200 text/html containing the application index**,
not JavaScript. This confirms an asset-fallback defect in the current deployment.
It differs from the earlier reported 404; historical routing behavior remains
unverified. Neither response establishes exactly when the old chunk disappeared.

Repository inspection found Vite 6.4.3, default `/` base and `dist` output,
React.lazy route imports, Suspense loading fallbacks, no custom route error
boundary, no preload error handler, and no service-worker registration in the
searched source/public files. `vercel.json` had an unrestricted SPA rewrite and
no explicit cache headers. No external error-monitoring integration was found.

## Decision

Keep lazy loading and the current route hierarchy. Register an eagerly imported
React Router error boundary at each existing top-level route and its immediate
children, preserving custom `ErrorBoundary` and `errorElement` definitions.
The inspected tree has exactly one child level; a regression assertion guards
that assumption. No recursive registration is needed. The child boundary keeps the dashboard shell mounted. Unexpected exceptions receive application-error text, not server-error text.
HTTP responses have distinct 401, 403, 404, 5xx, and other-request messages and
retain their numeric status. All failures offer a home link; 401 additionally
offers the existing login route (without changing authentication or clearing
credentials). Only chunk, unexpected, and server failures offer refresh. React Router still reports render failures through its own error
handling. No raw error payload is inserted in the UI.

Recognize narrowly specified native import error signatures (Chromium, Firefox,
Safari) and Vite CSS preload failures. Native errors have no standardized code;
unrecognized messages intentionally receive the generic fallback. A network
failure and a missing deployment asset cannot reliably be distinguished by the
native error alone, so the message describes both possibilities.

Register one `vite:preloadError` listener in `main.tsx`, before rendering, with
HMR disposal. It records diagnostics only. The installed Vite helper confirms
that `preventDefault()` suppresses the rejection; doing this without a replacement
module would break React.lazy's rejected-import recovery. Let the rejection
reach the route boundary instead. The listener is not a second UI handler.

Both paths share deduplicated console diagnostics using a WeakSet. Diagnostics
include only a dashboard/public area, a restricted asset basename when present,
and a connectivity hint. They exclude full URLs, route IDs, queries, credentials,
and error payloads. `navigator.onLine` is only a hint. There is no new external
monitoring service or persistence.

Refresh is exclusively user initiated, with an explicit unsaved-work warning and
the existing Radix AlertDialog confirmation. This is not dirty-form detection
or draft preservation; the dialog explicitly says so. Cancel receives initial
focus, and closing restores focus to the refresh trigger. There are no automatic retries, retry flags, polling,
cache-busting parameters, or reload loops. A rejected React.lazy import is cached
by React, so rerendering it is not a reliable recovery action. A full refresh
loads the current HTML and module graph. Other mounted work is not forcibly
reloaded, but state inside an erroring subtree may already have been lost; this
change does not implement draft persistence.

## Cache and routing policy

Vercel documents a default revalidation policy (`public, max-age=0,
must-revalidate`); this incident does not prove that the platform served stale
HTML. Explicit `no-cache` rules make the HTML intent visible in the repository.
They cover `/index.html` and extensionless SPA paths. `/assets`, `/api`, and
file-like paths are excluded from the fallback and its HTML headers.

Only JS/CSS under `/assets/` with the current eight-character Vite content hash
receive `public, max-age=31536000, immutable`. Non-versioned files and API/private
responses do not receive that policy. Revisit the matcher if output naming
changes. The rule must not be used to publish mutable files with hash-like names.

HTML revalidation affects the next document request; it cannot replace JavaScript
already running in an open tab. Long asset caching remains useful and does not
retain every old chunk on the server. Missing assets must produce a real 404,
not SPA HTML. Vercel preview validation is required because Vite preview does not
emulate `vercel.json`, and local matcher tests do not prove platform routing.
Future client routes with dots in the last segment require an explicit rule.

Rejected alternatives: unconditional reload (unsaved work and loops), cancelling
all preload errors (hides evaluation failures), broad immutable caching (stale
HTML/private data risk), removing splitting (performance), and a new service
worker or monitoring dependency (unnecessary scope). Hosting old assets or
platform skew protection may complement this fix but requires separate platform
configuration and verification.

## Validation

Focused tests cover successful lazy imports, rejected imports, persistent parent
layout, English/Arabic and document direction, focus, confirm/cancel refresh,
unrelated render exceptions, loader response status, offline failure messaging,
diagnostic deduplication/redaction, listener cleanup, actual route registration,
and configuration matcher scope.

Executed: `yarn vitest run src/routes` passed 42 tests; changed-file ESLint
passed; `yarn build` passed TypeScript project checking and Vite compilation.
Build inspection verified the eager recovery code, Vite event helper, retained
StaticPagesPage dynamic import, and cache matcher coverage for all 133 emitted
JS/CSS assets. Vite reported chunks exceeding 500 kB; no chunking redesign was
attempted. The initial TypeScript route-union error was corrected before the
successful build. Browser automation could not
initialize (`trusted Node process exited unexpectedly`); no browser E2E, visual
review, or real two-deployment transition is claimed. The web tool could not
access production, but subsequent curl requests supplied the HTTP evidence above.

## Required preview and deployment verification

1. Check Vercel project settings: Vite preset, repository root, `yarn build`,
   output directory `dist`; confirm no dashboard-level overrides conflict.
2. Request `/`, `/login`, `/dashboard/pages`, and `/index.html`. Confirm HTML,
   expected routing, and `Cache-Control: no-cache` on actual GET responses.
3. Request current hashed JS and CSS from the built HTML/module graph. Confirm
   200, correct MIME type, immutable one-year caching, and executable content.
4. Request `/assets/definitely-missing-12345678.js`. Confirm 404 and that the
   body is not the application index. Confirm `/api/...` and non-versioned
   public resources are not rewritten or given immutable caching.
5. With recovery included in V1, open a preview alias on V1 and leave a tab open
   without visiting the target lazy route. Publish V2 to the same alias with a
   changed target chunk. Navigate from the V1 tab to `/dashboard/pages`.
6. If the old chunk is missing, verify a localized recovery view with the shell
   retained, no automatic reload, one diagnostic, keyboard focus, and usable
   navigation. Cancel Refresh to verify no reload, then confirm Refresh and
   verify V2 loads the route successfully. Check DevTools response and asset
   hashes. If old assets remain available, navigation should simply succeed.
7. Repeat with the target request blocked/offline, unrelated runtime failure,
   both locales, and mobile/desktop widths. Restore connectivity before refresh.
8. A deterministic local browser check can temporarily withhold a lazy chunk
   from a disposable production artifact; restore it before confirming refresh.
   Never delete a tracked source file or mutate an active production deployment.

Old tabs predating this recovery code cannot acquire the new handler without a
refresh. Entry-script failures before React starts are outside the route boundary.
Persistent outages or bad deployments can still fail after refresh; the user
retains control and the fallback remains available when the entry bundle loads.

## References

- [Vite build and load error handling](https://vite.dev/guide/build.html#load-error-handling)
- [Vite troubleshooting](https://vite.dev/guide/troubleshooting.html)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel Cache-Control](https://vercel.com/docs/caching/cache-control-headers)
- [Vercel routing rewrites](https://vercel.com/docs/routing/rewrites)

## Production-readiness review

- Medium, fixed: HTTP failures shared generic error copy and refresh actions.
  Status-specific copy/navigation now separates authorization, missing resources,
  server errors, other requests, and unexpected application exceptions.
- Medium, fixed: default registration replaced custom boundaries. Both boundary
  forms are now preserved and the actual dashboard layout is regression-tested.
- Low, fixed: native confirmation bypassed the design system; AlertDialog now
  uses existing focus management and localized labels. It provides no draft guarantee.
- Low, fixed: diagnostic asset extraction omitted dotted basenames; it now
  accepts them while excluding URL queries and fragments.
- Medium, fixed: file-like requests with a trailing slash could reach the SPA
  fallback. The exclusion includes that slash, with a regression case.

Vercel's current [configuration reference](https://vercel.com/docs/project-configuration/vercel-json#negative-lookahead)
requires the negative lookahead to be wrapped in a capture group; the rule follows
that syntax, including noncapturing inner groups and JSON-escaped dots. Rewrites
check existing filesystem resources first. Sources are case-sensitive. The HTML
and asset header matchers are disjoint, so their ordering does not resolve any
conflict. Function response Cache-Control overrides configuration; CDN-Cache-Control
and Vercel-CDN-Cache-Control may also affect edge behavior. There are no such
headers in this configuration. Project-level overrides still require Preview checks.

The eight-character matcher is a contract with the current Vite output, not a
universal guarantee. A naming change would omit immutable caching (safe but slower);
mutable public files must never be published under matching hash-like filenames.
Local JavaScript matcher tests are scope checks, not Vercel parser or HTTP tests.
No Vercel CLI/parser dependency was installed, and no Preview deployment was created.
Check missing hashed asset responses for unintended long-lived negative caching.

Browser signature tests are fixtures for known messages, not cross-browser E2E.
Unknown signatures get generic application recovery. Module evaluation exceptions
from the Vite event are neither classified as chunks nor cancelled; their rejection
continues to React Router. Duplicate diagnostics are suppressed for the same Error
object only; genuinely separate failures may produce separate records.

### Rollout and rollback

- Record the current known-good deployment ID and its build/configuration before rollout.
- Create a Preview only with deployment authorization. Run every HTTP and V1/V2
  check above, including trailing-slash asset paths, 401/403/404/5xx states,
  keyboard confirmation, both locales, and the existing login/auth redirect flow.
- Confirm correct MIME types, non-overlapping HTML/asset headers, missing-asset
  404s, unaffected API responses, and no automatic reload. Do not promote on failure.
- Promote only after Preview evidence is recorded. Monitor chunk/network failures,
  route availability and authentication, then repeat the production smoke checks.
- If routing, caching, or recovery regresses, restore the recorded known-good
  deployment via Vercel rollback under deployment authorization. Recheck direct
  routes, login, current assets, and response headers. Do not delete old assets.
- Rollback also changes the active module graph: existing tabs may still need a
  user-confirmed refresh. If the previous release lacks recovery, communicate
  manual refresh guidance. Keep the failing deployment available for diagnostics.

### Review validation results (2026-10-14)

- `yarn vitest run src/routes`: 42 tests passed, including real dashboard layout
  retention, custom boundaries, HTTP recovery, locales, dialog focus and cancel,
  browser-signature fixtures, and uncancelled non-chunk Vite errors.
- `yarn typecheck`: passed after correcting test fixture return/route-union types.
- `yarn lint:strict`: passed repository-wide. Changed-file lint also passed.
- Changed-file Prettier check and `git diff --check`: passed.
- `yarn build`: passed; Vite emitted the existing large-chunk warning. All 133
  generated JS/CSS filenames match the current immutable-cache rule.
- Full `yarn test`: 1903 passed, 29 failed, across 220 files (202 passed,
  18 failed). This run overlapped other validation processes. It is not a green
  repository-wide test result. Failed files were rerun serially without changing
  timeout settings; see the follow-up result below.

Evidence-backed unrelated failures include Store Ratings endpoint expectations
(`/store-ratings` versus committed `/dashboard/store-ratings` at service test
lines 40/106), the admins query-key test line 7 expecting no filter object,
MultiSelect's form-surface test line 107 expecting `bg-background` while the
unchanged component uses `bg-black-50`, and download-file test line 16 constructing
`Response` from a jsdom Blob without `stream()`. These files have no task diff and
exercise their own services/components rather than recovery registration. No
unrelated code, tests, dependencies, or timeout settings were changed.

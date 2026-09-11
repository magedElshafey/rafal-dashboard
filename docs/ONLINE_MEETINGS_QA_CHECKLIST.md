# Online Meetings QA Checklist

Record environment, build SHA, API environment, Zoom SDK version, browser/WebView version, OS/device, role, Session/Exam ID, timezone, result, and evidence for every run. Never attach screenshots or logs containing bearer tokens, meeting credentials, or unapproved real account/participant names; use disposable identities or approved redaction.

## Test matrix

- [ ] Chrome, Edge, Safari, and Firefox versions supported by the product.
- [ ] Android System WebView current stable on phone and tablet.
- [ ] iOS WKWebView current supported iOS versions on iPhone and iPad.
- [ ] English/LTR and Arabic/RTL.
- [ ] 320, 375, 768, 1024, and 1440 CSS-pixel widths.
- [ ] Portrait and landscape; rotate while joining, joined, reconnecting, and warning visible.
- [ ] Keyboard-only desktop operation and screen reader status announcements.
- [ ] Reduced-motion mode.
- [ ] Fast, slow, interrupted, offline, and recovered network.

## Teacher list and happy path

- [ ] `/teacher/session` uses the Teacher shell, one page heading, description, four statistics, URL-backed filters, and two-column desktop cards.
- [ ] Total equals `paginate.total`.
- [ ] Completed % is `extra.completed / total * 100`, Upcoming % is `extra.upcoming / total * 100`, and zero total renders 0% without `NaN`.
- [ ] Attendance uses `extra.attendance_rate` and existing locale percentage formatting.
- [ ] Search/group/subgroup/type/status/date filters survive refresh and appear in request/query key.
- [ ] Exactly 15 items are requested per page; infinite paging keeps filters.
- [ ] Upcoming Online shows Start live session.
- [ ] Live Online shows Rejoin live session.
- [ ] Completed shows no Start/Rejoin.
- [ ] Offline never opens Zoom and has no Zoom Start/Rejoin.
- [ ] A list Start/Rejoin click first force-fetches authoritative detail; completed and Offline results do not navigate into a meeting.
- [ ] The list never calls Start and never receives/stores Zoom credentials.
- [ ] Upcoming navigation carries only a one-use, TTL-bound non-secret Start intent; Live navigation carries no credential handoff.
- [ ] The owned host room calls Start once, validates fresh credentials, and joins only while its captured ownership fence is still current.
- [ ] Refresh/Rejoin calls Start again in the owned room and joins the same meeting with fresh credentials.
- [ ] A room Start `409` shows the translated another-live message, stays in the controlled room state, and does not retry automatically.

## Active Session client ownership

- [ ] The first Teacher or Student Session client acquires ownership before iframe mount and before Start/Signature.
- [ ] Ownership scope includes authenticated user ID, meeting role, `session`, and exact Session ID; Online Exams are not placed in this Session scope.
- [ ] Supported browsers use an exclusive Web Lock; fallback uses a heartbeat-backed fenced storage lease and BroadcastChannel/storage events.
- [ ] Locks, leases, and coordination messages contain no token, signature, ZAK, passcode, meeting number, or raw API response.
- [ ] A second tab/WebView shows the custom conflict state and creates no iframe or credential request.
- [ ] Cooperative Take Over retires the incumbent runtime before it releases ownership, then the successor obtains a new fence and fresh credentials.
- [ ] A late Start/Signature response from a released/replaced fence is ignored before SDK Join.
- [ ] Lease replacement/expiry/storage failure retires the stale client; it cannot Join or reconcile after ownership loss.
- [ ] Closing/crashing the owner allows takeover only after cooperative release or bounded lease expiry; record browser/WebView limitations.

## Teacher host room

- [ ] Header shows Session name, parent group, subgroup, online type, and non-color-only connection status.
- [ ] Smart Hub Preparing, Fetching credentials, Initializing, Joining, Connected, Reconnecting, Ending, Ended, and Error states replace raw SDK lifecycle UI.
- [ ] Meeting surface has only the scoped required linear-gradient overlay and it never blocks Zoom controls or End.
- [ ] Teacher can use supported host audio, video, participants, chat, share screen, record, reactions, and host controls.
- [ ] Refresh/return reads authoritative detail first; completed renders Ended without ownership/iframe/Start, while live ownership calls Start once for fresh signature/ZAK and rejoins.
- [ ] Route change, refresh, tab hide, WebView background, and transient disconnect do not call backend End.
- [ ] Teacher route/page exit performs local iframe retirement and ownership release only; it does not invoke host SDK Leave or backend End.
- [ ] Returning after an unexpected route close can Rejoin the still-live Session.
- [ ] Recording absence immediately after End is tolerated; later detail can expose the record.
- [ ] A typed credential Join failure refetches authoritative detail and performs at most one fresh iframe + Start retry; a second failure is terminal.

## Manual End

- [ ] End Session is visible only for a live Teacher Session.
- [ ] Confirmation explains that all participants are removed.
- [ ] Cancel makes no SDK/backend request.
- [ ] Confirm enters Ending and disables duplicate action.
- [ ] Supported Zoom host-end is requested, backend End is called once, cache updates narrowly, resources clear, one toast appears, and the custom Ended state appears once.
- [ ] Double click produces one End.
- [ ] Backend success still reaches the custom Ended state when SDK cleanup fails.
- [ ] Backend failure stays in custom Error and explicit retry can succeed.
- [ ] Already-completed response/detail is normalized as ended.
- [ ] The Ended state removes the iframe, moves focus to its accessible dialog/status region, and exposes one explicit Back action.

## Automatic End and warning

- [ ] Deadline is exactly API `due_date + duration` minutes, including offset-bearing dates.
- [ ] Starting late does not move the deadline.
- [ ] Warning opens once when remaining first reaches ten minutes or less and greater than zero.
- [ ] Warning has the required Smart Hub gradient, accessible status text, a localized second-by-second `10:00` → `00:00` countdown, responsive/RTL layout, visible Close hover/focus/active states, and no Extend.
- [ ] Dismissal prevents reopening on each tick; second-by-second rerenders remain scoped to the deadline notice rather than the host page.
- [ ] Crossing the threshold while hidden shows warning once on visibility/focus/resume.
- [ ] While a host controller is executing, the deadline invokes coordinated backend End once.
- [ ] Timer/manual and timer/SDK-ended races run one coordinated End, toast, cleanup, and custom Ended state.
- [ ] Resume/reload after deadline enters Ending immediately, skips warning/Start/join, and invokes the coordinator once; backend End is called only when authoritative detail remains Live.
- [ ] Browser sleep and device clock forward change are corrected by absolute deadline comparison.
- [ ] Clock backward change postpones only according to the platform clock; record this operational limitation.
- [ ] Closing every host tab/terminating every host WebView produces no frontend End and demonstrates why a monitored backend scheduler is authoritative.

## Teacher edge cases

- [ ] Start double click.
- [ ] Start timeout and explicit retry.
- [ ] Upcoming navigation failure cannot leak or reuse the one-use Start intent; returning/refetching uses authoritative status.
- [ ] Start succeeds but SDK init fails: retry obtains fresh credentials.
- [ ] Credential-classified Join failure retries with a fresh lifecycle/credentials once only; non-credential failures do not enter that automatic loop.
- [ ] Join failure, expired signature, expired ZAK, missing passcode, invalid meeting number/WebRTC mode.
- [ ] Teacher Join passes the non-empty `appKey` from the validated role-1 JWT as `sdkKey`; no separate key is invented or persisted.
- [ ] Another Session live, completed-before-Start, and Offline fail safely.
- [ ] Back during join aborts/ignores stale callbacks and does not End.
- [ ] Background during join and resume after deadline.
- [ ] Network loss, Reconnecting, recovery, and permanent SDK failure.
- [ ] Teacher closes WebView without End, then returns/Rejoins.
- [ ] End double click, timer/manual race, timer/SDK-ended race.
- [ ] SDK ends but backend End fails; explicit synchronization retry.
- [ ] Deadline passed on load and warning threshold crossed in background.
- [ ] Strict Mode causes no double Start/init/join/End.
- [ ] Route changes from Session A to B ignore A callbacks/credentials.
- [ ] Auth expiry, logout, role change, and unmount during request clear credentials.
- [ ] Loaded detail/list caches never regress from `completed` to `live` when an older Start/detail response resolves late.
- [ ] End writes `completed` monotonically to detail and every loaded list, removes mismatched filtered cards, and invalidates Session lists narrowly without canceling authoritative status reads.

## Student Session happy path and permissions

- [ ] Assigned Student opens `/user/course/{uuid}/online-session`.
- [ ] Frontend requests `subject_type=session` and exact UUID once per explicit attempt/refresh.
- [ ] Response role is 0 and every permission is false before SDK init.
- [ ] Before status `2`, only the translated Smart Hub Waiting for the Teacher state is visible; the SDK surface is invisible, inert, and non-focusable.
- [ ] Zoom Workplace, waiting-room banners, participant tiles, warning banners, and the Zoom toolbar never appear while waiting.
- [ ] Student hears Teacher and sees Teacher video/screen content.
- [ ] Browser iframe permission policy has no Camera, Microphone, or display-capture.
- [ ] Browser/WebView never prompts Student for Camera/Mic.
- [ ] With pinned Client View 6.2.0, the exact `KB0078476` capture notice is hidden only for Student Sessions; unrelated and Online Exam notices remain visible.
- [ ] Receive-only Teacher audio/video continues after the notice workaround, and its DOM selector/article integration is revalidated before every SDK upgrade.
- [ ] Zoom footer/toolbar and audio, video, chat, participants actions, rename, share, record, reactions, raise hand, apps, notes, and whiteboard are absent and not keyboard-focusable.
- [ ] After admission, the Student SDK surface remains pointer-disabled and outside the tab order while remote media continues playing.
- [ ] Smart Hub external Leave Session is reachable, accessible, safe-area aware, calls SDK leave/release, navigates, and never calls Session End.
- [ ] Teacher End produces custom Ended state and releases resources.
- [ ] Remote host End retires the iframe, releases ownership, patches/invalidates Student Home, and opens exactly one accessible Session-ended popup over “No live session now.”
- [ ] OK, close, and Escape dismiss the popup without retrying; the no-live state remains and exposes the explicit Home link.
- [ ] Revisiting the exact ended Session in the same application lifecycle creates no ownership client, signature request, retry action, or iframe; a different Session remains joinable.

## Student edge cases

- [ ] Invalid subject type, missing ID, and non-UUID route fail closed before signature request.
- [ ] Not assigned, too early, expired join window, and not started map only from an approved machine-readable backend contract, never localized text guessing.
- [ ] Signature timeout/expiry and malformed role/permissions/JWT fail before SDK init and allow explicit retry only.
- [ ] Session joinability/signature denial creates no Zoom iframe or initialization attempt; Retry performs a new preflight.
- [ ] SDK init/join failure uses custom sanitized error; a typed credential failure uses a fresh iframe and signature automatically at most once.
- [ ] Host disconnect, Student network loss, Reconnecting, recovery.
- [ ] Refresh obtains fresh credentials without persistence.
- [ ] A second Student Session tab/WebView in the same coordination scope does not obtain credentials until it owns the Session; neither client can End.
- [ ] Any unexpected Camera/Mic request is denied and treated as a defect.
- [ ] Background/foreground, Android recreation, iOS suspension, missing/expired token, malformed auth storage.
- [ ] Unsupported WebView, Zoom service error, and `/meetings/url` denial show safe errors.

### Student completed-refresh contract blocker

- [ ] A backend contract owner has supplied either an approved Student Session status/detail endpoint or an approved stable machine-readable completed/not-started discriminator in the existing Signature contract.
- [ ] A fresh completed Student Session route renders custom Ended without creating an iframe or requesting/joining with credentials.
- [ ] The implementation does not invent an endpoint, infer status from localized error text, or treat an undocumented HTTP/message combination as authoritative.
- [ ] Completed remains distinguishable from unauthorized, not assigned, too early, and transient/network failure on a new document lifecycle.

Until these items are satisfied, remote End in an already-open Student page can be validated, but completed-after-hard-refresh is blocked and the full Student Session E2E matrix cannot pass.

## Online Exam regression

- [ ] Student Online Exam route still uses `subject_type=exam` and attendee role 0.
- [ ] Exam uses the backend permission matrix, its own subject-scoped active-client ownership, and never receives/sends ZAK.
- [ ] Exam never calls Session Start, Session End, or Session auto-end.
- [ ] Exam Leave does not submit/complete the exam unless the existing exam domain independently does so.
- [ ] Exam fatal-error Retry remounts a fresh iframe and obtains fresh attendee credentials; it is not a no-op after cleanup.
- [ ] Teacher/Admin are denied Online Exam meeting routes.
- [ ] Assistant attendee scenario is blocked from release validation until a real Assistant Exam route/backend contract exists; once supplied, verify role 0, no host, and no Session End.
- [ ] Complete the dedicated `ONLINE_EXAMS_MEETING_QA_CHECKLIST.md` before staged release.

## WebView auth and security

- [ ] `auth_session` is written at document start as valid JSON with token, valid role/portal, full user, and persistence.
- [ ] Token is JSON-escaped and absent from URL, console, analytics, crash reports, screenshots, and navigation history.
- [ ] Flutter never supplies signature, ZAK, passcode, meeting number, or SDK client ID.
- [ ] Main-frame navigation is allowlisted to exact Smart Hub HTTPS origin.
- [ ] Teacher OS/Web permissions grant only Camera/Mic; Student denies all media capture.
- [ ] Token refresh replaces the complete auth object once; logout removes it and exits.
- [ ] Background/foreground preserves controller and dispatches `smart-hub:webview-resume`.
- [ ] Android activity recreation restores auth/route but not meeting credentials.
- [ ] iOS suspension and process termination limitations are documented and observed.
- [ ] Orientation/keyboard resizing does not recreate the meeting or hide End/Leave.

## Protocol, cleanup, and security regression

- [ ] Foreign origin/source, wrong version, stale load nonce/lifecycle/attempt, malformed commands, and unknown events are ignored.
- [ ] Mixed Zoom asset versions fail closed.
- [ ] Only one SDK init and join runs per iframe lifecycle.
- [ ] Cleanup is idempotent and removes parent listeners/timers; retiring the iframe unmounts the browsing context rather than merely hiding it.
- [ ] Participant explicit Leave uses bounded `leaveAndRelease`; participant page exit uses best-effort Leave plus local retirement.
- [ ] Teacher page exit uses local retirement only because host SDK Leave may end the meeting for everyone.
- [ ] Credential responses remain only in the current operation/exact Join message and clear on reset, End, Leave, unmount, fatal error, logout, or identity change.
- [ ] The one-use Start intent stores only Session ID + expiry; there is no credential vault/handoff.
- [ ] No credential is stored in localStorage/sessionStorage/query parameters/persisted Zustand/long-lived React Query cache/DOM attributes.
- [ ] Per-runtime/app-bootstrap/same-identity sync never deletes origin-wide Zoom SDK storage under another active tab; the exact allowlisted cleanup runs only at a real auth boundary and preserves auth, locale, theme, Exam timing, ownership data, and unrelated storage.
- [ ] Online Session async cache writers reject results after an auth-boundary epoch change. Do not interpret this as a global fence for unrelated already-running TanStack mutations; those modules require their own epoch fence or a separately designed identity-scoped QueryClient.
- [ ] Error UI contains no raw API body, JWT, ZAK, passcode, token, stack dump, or meeting metadata.

## Accessibility and responsive acceptance

- [ ] Exactly one page `h1`; lifecycle subheading hierarchy is correct.
- [ ] Busy states have `aria-busy`; status uses polite live region; errors use alert semantics.
- [ ] End dialog traps focus, has title/description, restores focus, and supports Escape/Cancel.
- [ ] End, Leave, Retry, warning dismiss, filters, and cards work by keyboard with visible focus.
- [ ] Connected/Reconnecting is conveyed with text, not color alone.
- [ ] Hidden Student SDK controls are not focusable.
- [ ] Arabic layout, icons, date/time/percentage formatting, and directional navigation are correct.
- [ ] Meeting keeps stable dimensions without layout shift and no horizontal overflow at all target widths.
- [ ] Overlay preserves contrast and never leaks outside the surface.
- [ ] Reduced-motion users are not forced to see continuous decorative animation.

## Release evidence

Current browser evidence as of 2026-08-06 is **Student-only and not release acceptance**. Pre-change, an authenticated Student context reached a live Session with two observed participant tiles; a second same-profile tab showed the ownership conflict before meeting initialization, and the live view exposed Zoom's capture-permission notice. A completed Student hard refresh reached the generic not-joinable error because the Signature contract has no stable completed discriminator. Post-change, that denied route showed the custom not-joinable state with zero iframes, proving denial-before-initialization but not a completed-specific Ended state. No authenticated Admin or Teacher context, full-role flow, manual/automatic End, second Session, roster reconciliation, backend scheduler, or Android/iOS WebView run has passed.

- [ ] Evidence table records Admin fixture creation, Teacher/Student refresh, manual End, automatic End, and second Session.
- [ ] Every evidence row includes role, route, Session ID, lifecycle sequence, sanitized request name/status, observed participant count, evidence path, and pass/fail.

- [ ] Formatting check command/result attached.
- [ ] Strict lint command/result attached.
- [ ] TypeScript command/result attached.
- [ ] Shared core, Teacher, Student, Exam, timing, route, security, accessibility, and existing Zoom tests attached.
- [ ] Production build command/result attached.
- [ ] Browser screenshots attached for Teacher list, Teacher host lifecycle/connected/warning, Student view-only, EN/AR, desktop/mobile.
- [ ] Android/iOS WebView results attached.
- [ ] Any unrelated failures are listed separately with evidence.
- [ ] Backend scheduler ownership and monitoring are confirmed before claiming authoritative automatic End.

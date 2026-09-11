# Online Exams Meeting QA Checklist

Use isolated browser profiles/data stores for every role. Record the frontend commit, API environment, Zoom meeting configuration, Exam IDs, browser/WebView versions, locale, viewport/orientation, and evidence links. Never record tokens or Zoom credentials.

## Contract gate

- [ ] Student signature uses `GET /meetings/signature?subject_type=exam&subject_id={uuid}`, returns role `0`, and includes all nine boolean permissions.
- [ ] `/meetings/url` is used only for access/URL behavior and never as a credential source.
- [ ] Backend enforces Student assignment, Online type, joinability, and join window.
- [ ] Assistant endpoint, query, response, join-window errors, authorization, and permission matrix are confirmed before enabling an Assistant route.
- [ ] Zoom Waiting Room and join-before-host are disabled for the hostless Exam meeting.
- [ ] No Exam response or frontend state contains ZAK.

## Student browser

- [ ] Assigned Online Exam appears in Pending and Details opens only under existing Exam rules.
- [ ] Join is unavailable before the window and after it closes; direct route access fails closed.
- [ ] A joinable Exam acquires `user + student + exam + Exam ID` ownership before credentials.
- [ ] Exactly one signature request, iframe initialization, and SDK Join occur.
- [ ] Connected content appears only after joined/admitted state.
- [ ] Connected, reconnecting, leaving, ended, and error UI uses Online Exam copy rather than Session/Teacher copy.
- [ ] Leave performs Zoom Leave, SDK release, credential cleanup, ownership release, and safe Back navigation.
- [ ] Leave does not call Session Start/End and does not submit the Exam.

## Student permissions

- [ ] Every returned permission is reflected in SDK feature configuration.
- [ ] Camera is absent from iframe policy and no Camera prompt occurs when `can_start_video=false`.
- [ ] Microphone is absent from iframe policy and no Microphone prompt occurs when `can_start_audio=false`.
- [ ] Display capture is absent and Share cannot run when `can_share_screen=false`.
- [ ] Chat, record, reactions, and supported attendee features are absent/unavailable when false.
- [ ] Forbidden controls are not keyboard- or touch-reachable and application commands cannot invoke them.
- [ ] A receive-only attendee can still hear remote audio and view remote video/screen share.
- [ ] A backend-allowed feature is interactive only after joined state.
- [ ] No host controls, End Meeting, participant host management, or ZAK behavior appears.

## Assistant browser

- [ ] Use a separate signed-in Assistant profile; do not overwrite Student auth.
- [ ] Authorized Assistant sees only the confirmed Online Exam Join action and route.
- [ ] Unauthorized Assistant is denied by backend and route/request guards.
- [ ] Assistant joins with role `0`, the confirmed Assistant permission matrix, and no host controls.
- [ ] Assistant refresh obtains fresh credentials and does not duplicate the participant.
- [ ] Assistant Leave releases only its attendee client and never ends/submits the Exam.
- [ ] Teacher and Admin profiles have no Join action, are denied on direct route, make no signature request, and create no SDK iframe.

## Refresh, reconnect, and isolation

- [ ] Browser refresh best-effort Leaves the old iframe, releases/transfers ownership, and requests fresh credentials.
- [ ] Refresh creates one new SDK instance and one new Join with no duplicate active participant.
- [ ] Offline/online, focus, and visibility recovery show Reconnecting and reconcile a snapshot without a second Join.
- [ ] Android activity recreation and iOS suspension/reload reacquire ownership and fetch fresh credentials.
- [ ] Expired credentials before Join receive at most one automatic fresh-credential retry.
- [ ] A stale response/callback from Exam A is ignored after navigating to Exam B.
- [ ] Exam B requests a distinct credential set; Exam A credentials are never reused.
- [ ] Exam ownership does not collide with a Session, another Exam ID, or another attendee role.
- [ ] A duplicate tab shows conflict; Take Over retires the incumbent before new credentials are requested.
- [ ] A crashed/stale lease expires and recovery does not require deleting storage manually.

## Hostless Zoom configuration

- [ ] `zoom-waiting-for-host` never shows “Waiting for the Teacher.”
- [ ] `zoom-waiting-room` never exposes the Zoom waiting surface.
- [ ] Either signal performs best-effort Leave/cleanup, releases ownership, and shows translated configuration error UI.
- [ ] The configuration error exposes both Retry and Back with visible keyboard focus.
- [ ] Retry creates a fresh lifecycle and credential request; it does not loop.

## Exam lifecycle regression

- [ ] Meeting Join does not create a duplicate Exam attempt.
- [ ] Existing answers/drafts survive Join, reconnect, SDK error, Leave, and refresh.
- [ ] Existing autosave behavior and Exam-scoped storage keys remain unchanged.
- [ ] Exam timer still derives from Exam start/duration; Zoom timers do not replace it.
- [ ] Zoom End/Leave/disconnect does not submit or complete the Exam.
- [ ] Existing Online Exam upload uses the established submission route and deadline.
- [ ] 409 duplicate submission and 410 expired submission behavior remains correct.
- [ ] Submission success retires meeting resources when product flow closes the meeting.
- [ ] Submission failure preserves unsaved upload/attempt state.
- [ ] Query reconciliation does not reset an active Exam attempt.
- [ ] MCQ and Parent Supervision Exam routes and behavior are unchanged.

## Android and iOS WebView

- [ ] Flutter injects only the exact frontend auth state using safe JSON encoding.
- [ ] No token, signature, passcode, SDK client ID, permission payload, or ZAK appears in a URL.
- [ ] Main-frame navigation is restricted to the exact Smart Hub origin; the same-origin iframe loads.
- [ ] JavaScript, DOM storage, cookies, WebRTC playback, inline media, autoplay, and hardware acceleration work.
- [ ] Native Camera/Microphone requests are accepted only from the trusted origin and only when the web iframe policy permits them.
- [ ] Receive-only Student Exam does not prompt for Camera/Microphone.
- [ ] Background/resume dispatches `smart-hub:webview-resume` without recreating the WebView unnecessarily.
- [ ] Logout clears auth and meeting resources; refresh/token replacement never transports Zoom credentials.
- [ ] Real Android and iOS device results are recorded separately; browser simulation is not claimed as device proof.

## Localization, accessibility, and layout

- [ ] English and Arabic include every Online Exam lifecycle, ownership, hostless error, Retry, Back, and Leave string.
- [ ] Arabic RTL order, icons, focus order, and text wrapping are correct.
- [ ] Loading/error regions use correct `status`/`alert`, live-region, busy, inert, and hidden semantics.
- [ ] Forbidden iframe content is not in the parent accessibility/tab order.
- [ ] Keyboard-only and screen-reader flows can Retry, Back, Take Over, and Leave.
- [ ] 320/375/768/1024 widths preserve stable meeting dimensions and reachable controls.
- [ ] Portrait and landscape respect safe areas; no control is hidden behind mobile browser/WebView chrome.

## Network, auth, and negative failures

- [ ] Too early, window closed, completed, cancelled, unassigned, and unauthorized responses render sanitized translated UI.
- [ ] Credential timeout, malformed response, role mismatch, and missing permissions fail without mounting/revealing Zoom.
- [ ] Invalid passcode, locked meeting, participant limit, SDK init/Join failure, and protocol mismatch are recoverable or terminal as designed.
- [ ] Token expiry follows normal auth restoration/refresh and never retries credentials indefinitely.
- [ ] Telemetry/Snowplow failures remain non-fatal.
- [ ] No credential or raw backend/SDK exception appears in UI, console, analytics, storage, history, screenshots, or coordination messages.

## Online Sessions regression

- [ ] Teacher Start and rejoin remain single-flight and role-1/ZAK-correct.
- [ ] Teacher manual End, automatic End, warning/countdown, and ended popup remain correct.
- [ ] Student Session role-zero join, waiting/admission synchronization, and receive-only permissions remain correct.
- [ ] Session credential cleanup, refresh, duplicate-tab ownership, and route changes remain correct.
- [ ] Session ownership copy and keys remain Session-specific; Exam locks do not collide.
- [ ] Full relevant Session automated suite and browser scenarios are recorded before release.

## Release evidence

- [ ] Format, changed-file lint, full lint, TypeScript, focused Exam/Assistant/route/protocol/lifecycle/permission/ownership/attempt/WebView/Session/accessibility tests, build, and `git diff --check` are recorded.
- [ ] Student real-browser join/refresh/Leave/Exam-B evidence is attached.
- [ ] Assistant real-browser join/refresh/Leave evidence is attached or explicitly blocked by the missing contract/profile.
- [ ] Teacher/Admin negative browser evidence is attached.
- [ ] Unrelated failures, backend/Zoom limitations, browser tooling limitations, and real-device gaps are separated.
- [ ] Staged-QA and production-readiness decisions explicitly reflect every unresolved critical scenario.

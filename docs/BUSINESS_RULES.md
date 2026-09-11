# Approved business rules

This document records the approved frontend behavior for Tasks, Assignments, and Exams. These rules take precedence over placeholder design copy and legacy frontend behavior.

## Shared status and type values

Supported task statuses are:

- `upcoming`
- `submitted`
- `missed`

Supported Exam API types are:

- `mcq`
- `online`
- `parent_supervision`

The URL spelling for the last type is `parent-supervision`. Unknown DDL values are ignored rather than rendered as generic tabs or actions.

## Tasks dashboard

- `GET /tasks` is Student-only; no Parent Tasks endpoint exists.
- The dashboard shows completion rate, average grade, Assignment upcoming/missed counts, Exam upcoming/missed counts, and urgent items.
- Assignment View All goes to `/assignments`; Exam View All goes to `/exams`.
- An urgent Assignment opens `/assignments/:assignmentId`.
- The urgent response does not contain an Exam subtype, so an urgent Exam goes to `/exams`. The frontend must not guess the subtype or fetch additional lists solely to discover it.
- The Tasks query is a single cached request and is disabled for Parent users.

Backend alignment needed: add `exam_type` to urgent Exam items if direct type-specific routing is required.

## Assignments

Assignment list filters are URL search parameters: `?status=upcoming|submitted|missed`. API aggregate values, not loaded-page length, drive Submitted/Upcoming/Missed totals.

### Role behavior

- Student: may open and submit Upcoming Assignments, view authorized Submitted details, and request Missed extensions.
- Parent: may see Upcoming cards but cannot open or submit them; may view approved Submitted details and request Missed extensions.
- Direct URLs must enforce the same rules as visible buttons.

Backend alignment may still be needed for approved Parent detail responses if the deployed API returns 404. The frontend must show a recoverable error and never fabricate data or depend on navigation state.

### Files and grading

- Upcoming `file` is the question/Assignment file.
- Submitted `file` is the Student answer.
- Submitted `grading_file` is the Teacher feedback/graded file.
- A Submitted list card opens `grading_file`, not the Student answer.
- Missing or unauthorized media is omitted; URLs are never constructed from absent data.
- Ungraded submissions show a translated not-graded state, never a fake 0%.
- `feedback` is a string and `graded_by` supplies the real grader name. Do not use the legacy strengths/weaknesses/comment model or invent a role.

### Submission

`POST /assignments/:assignmentId/submit` accepts one PDF up to 50 MB in multipart field `file`. Submission does not reload the page. Success goes to `/assignments/uploaded`, with navigation to Home and `/assignments?status=submitted`.

Optimistically remove the item from loaded Upcoming caches, update Upcoming/Submitted totals, and add a temporary Submitted item only when it can be constructed without fake fields or URLs. Reconcile on success and restore exact snapshots on error. Mark affected detail and Todo lists stale without immediate refetching; the response does not provide a Todo ID.

## Extension requests

Assignment and Exam extension endpoints accept multipart:

- `reason`: required, maximum 255 characters.
- `requested_due_date`: required, formatted `dd-mm-yyyy HH:mm` in local UI time.
- `notes`: required, maximum 500 characters.
- `files[]`: required repeated field; one or more PDFs up to 50 MB combined.

The requested datetime must be now or later. When `grading_deadline` exists, the maximum is exactly one hour before it. A null deadline means no invented maximum. Extension submission does not immediately move an item between statuses; only affected queries are marked stale with no immediate GET.

## Exams

Exam lists are filtered by both type and URL status. `due_date` is the start time; the active window ends after `duration` minutes unless an approved extension replaces the due date. Backend status remains authoritative, while frontend time calculations control actions and route access.

### Student

- MCQ: details/start are Student-only; Start enables at `due_date`.
- Online: details enable five minutes before `due_date`; Join enables at `due_date` through the allowed meeting window; answer upload is available after the meeting and before `grading_deadline`.
- Parent Supervision: the Student cannot view/download the question file, but may access the separate answer-upload page while allowed.

### Parent

- Upcoming MCQ and Online cards are display-only.
- Upcoming Parent Supervision details and question download are allowed.
- Parent never starts, joins, or submits an Exam.
- Missed extension requests are allowed for supported types.
- Submitted MCQ/Online data remains list-only with no details or analysis.
- Submitted Parent Supervision details are allowed when returned by the API.

### MCQ behavior

Show one question per step and key answers by question ID. Previous/Next navigation may proceed without an answer, but final submission is blocked until every question is answered exactly once. The error summary lists and links missing steps. Preserve backend ordering and submit only real question/answer IDs.

A best-effort start timestamp is stored in session storage per Exam ID, reused after a same-tab refresh, and cleared after successful submission. Time Taken is displayed only when available. Client time is not an authoritative grading/security signal.

Do not add DevTools detection, clipboard/right-click blocking, forced fullscreen/webcam behavior, focus-loss punishment, or unapproved auto-submit. Safe answer persistence, navigation warnings, countdown cleanup, and listener cleanup are permitted.

### Online meeting policy

The meeting signature request is `GET /meetings/signature?subject_type=exam&subject_id=<examId>` and occurs only after route/time guards pass. Apply supported SDK permissions so the Student cannot start audio/video, share, chat, rename, record, react, use whiteboard, or use notes. Clean up SDK listeners/resources on unmount.

### Submitted analysis

Analysis is available only to a Student for a submitted, graded MCQ. Filters are All (omit `status`), Correct (`status=correct`), and Incorrect (`status=incorrect`), each with a distinct cache key. Parent, Online, Parent Supervision, and ungraded flows must not request the endpoint.

### Exam submission

Online and Parent Supervision Student uploads accept one PDF up to 50 MB. Exam optimistic cache behavior follows the Assignment no-refresh/snapshot/reconcile/rollback rules, including targeted stale marking for Exam detail/analysis and Todo lists.

## Performance reports and attendance history

- Student and Parent portals share report and attendance behavior; query keys include the authenticated role to prevent cache collisions during portal transitions.
- Performance reports load unfiltered by default. A custom request is sent only when `date_from` and `date_to` form a complete, valid, non-reversed range; clearing returns to the unfiltered report.
- Report export is a backend PDF download and remains available without dates. Export does not invalidate or refetch report data.
- Attendance History supports only All, Online, and Offline modes. The `type` URL parameter stores Online or Offline; All removes it.
- Attendance uses infinite pagination with `per_page=15`. Summary metrics come from the active filtered response's `extra` block and are never derived from loaded cards.
- Attendance cards are informational and have no details route. Present, Late, and Absent are the supported states; unknown values use the translated unknown treatment.

## Admin Students

- The Admin Students module lists approved students only. Pending registrations remain in the Registrations module.
- Student create/update sends the selected Subgroup ID as `group_id`. Main Group is a dependent UI field and is never submitted.
- Student create/update assigns at most one Assistant through `assistant_id`. It is required on create and nullable on update; its DDL is scoped by the selected Subgroup through the `group` query parameter.
- Supported list filters are `group`, `sub_group`, `assistant`, and `is_active`; search uses `search`. Active status uses `is_active=1` and inactive status uses `is_active=0`.
- Groups may link to `/students?sub_group=<id>`. The Students page must preserve, display, and allow clearing that URL pre-filter.
- Export is a backend-generated Excel file using the current search and supported filters.
- Student deletion uses the backend soft-delete endpoint. Import is a separate flow and is not part of this module.
- Backend contracts take precedence over design placeholders. Reuse shared DDL services, query controls, drawers, and download helpers before adding feature-local alternatives.

## Admin Content Library

- Content Library is Admin-only. Folder deletion is not exposed, and files can be created only from inside a Folder.
- Folder lists use `search`, `main_group`, and `sub_group`; file lists always use `folder` and support Main Group filtering through `group` only.
- Root total folders comes from `paginate.total`, root total files comes from optional `extra.total_files` with a zero fallback, and a Folder's file total comes from `paginate.total`.
- Library file size is already expressed in MB. The frontend validates PDF type but applies no maximum file size.
- Global availability prohibits and omits all assignment fields. For scoped content, empty Students means every Student in the selected Subgroups.
- Students DDL accepts one Subgroup per request; multiple selected Subgroups are aggregated through stable cached queries and Student IDs are deduplicated.
- Editing a file may remove its PDF through the backend's nullable multipart field semantics. A failed download falls back to opening the safe PDF URL in a new tab.
- The backend contract remains the source of truth for assignments, visibility, pagination, and available filters.

## Admin Sessions

- The former Admin Schedule module is named Sessions and is available only to Admin users at `/sessions`; the old route has no redirect.
- Session status is backend-managed. The UI keeps the Upcoming Sessions wording, edits only upcoming Sessions, permits deletion for every status, and does not expose the backend Cancel endpoint.
- Online Sessions require a Chapter belonging to the selected Subgroup. Offline Sessions clear and omit Chapter data.
- `due_date` is submitted as local platform time in `dd-mm-yyyy hh:mm` 24-hour format and cannot be earlier than the current minute.
- Duration is an integer number of minutes from 1 through 240.
- List/Calendar mode is URL-backed. Calendar requests the visible month's first and last dates and keeps those month results paginated through infinite scroll.
- The Assigned Assistants statistic is the backend-provided total Assistant count and is never derived from loaded Sessions.
- There is no Session Details page; the detail endpoint is requested only to populate Edit.

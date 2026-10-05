# Contact Messages backend integration

This module manages public Contact Us messages in the Dashboard only. It follows page/component → TanStack Query hook → service → shared `$http`. No public submission endpoint, reply, email sending, create/edit, bulk action, export, search, or filter contract is implemented.

## Confirmed endpoints

- `GET /dashboard/contact-messages?page=:page` returns messages and `current_page`, `last_page`, `per_page`, `total`, `new_count` metadata.
- `GET /dashboard/contact-messages/:id` returns the full message. Opening Detail is a pure read: no automatic mark-as-read.
- `PATCH /dashboard/contact-messages/:id/status` sends only JSON `{ status: "new" | "read" | "resolved" }` and returns the full entity. The current value is excluded from choices; other confirmed targets are available without invented transition rules.
- `DELETE /dashboard/contact-messages/:id` returns `{ success: true, message: string }`. No response entity is required. The shared DeleteAlert requires confirmation.

## Validation and presentation

Zod validates IDs, strings, pagination counts, successful envelopes, and nested account data before normalization. Email, phone, and user are required nullable fields; null stays null in the domain. Blank strings are preserved, with localized unavailable presentation. A present user has `id`, `first_name`, `last_name`, and `email`, normalized to camelCase and shown as a Registered User separately from the contact name. A null user is a Guest. Account IDs are not treated as Customer routing IDs.

Read status remains an open string. Known statuses have AR/EN labels, and unknown statuses have a neutral textual fallback. Only new/read/resolved may be written. Subject and message are plain React text with direction isolation, wrapping, and preserved message line breaks. Detail does not truncate message content.

## Pagination and cache ownership

The service adapts confirmed metadata to the existing `PaginatedData` interface for `useInfinitePaginatedQuery` and `useInfiniteScroll`, retaining normalized metadata in `extra`. Next-page availability uses `current_page < last_page`, never row counts. Page is the only query parameter. The latest loaded response supplies the summary counts, including backend-owned `new_count`.

Status updates cache the matching canonical entity and invalidate exact Detail and Contact Messages lists. Deletes cancel/remove exact Detail and invalidate lists; a successful Detail delete navigates back to Index. Counters are never decremented locally. Mutations have retry disabled, submission locks, no optimistic changes, feature-owned feedback, and no unrelated invalidation.

## Backend-owned gaps

- The supplied Show example requested `/40` but returned entity `id: 49`. Show and status-update services reject identity mismatches; the wrong entity is never displayed or cached. Positive fixtures use matching IDs. Backend/sample identity needs correction.
- No search/filter parameters are supplied, so no search/filter UI exists.
- No public Contact Us POST contract is supplied; storefront submission is outside this task.

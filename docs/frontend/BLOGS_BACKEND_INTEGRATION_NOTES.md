# Blogs backend integration and production corrections

## Scope and evidence

Active repository: `E:/freelance/rafal/rafal-dashboard`. The request's `D:/megz` path is stale. This correction changes only `src/modules/blogs`, this document and the review artifact. Existing uncommitted route/shared/Static Pages changes from the earlier consolidation are preserved; those modules were not modified again. No dependencies, commits or pushes.

The user's supplied responses and Product Owner corrections are the evidence. No live API or Postman calls were made.

The consolidated architecture remains: Component → feature hook → separate category/post services → shared HTTP client. TanStack Query owns server state, RHF owns drafts, URL parameters own filters. Existing `blog-categories` and `blog-posts` query-key identities, canonical UI routes, legacy redirects and one Blog navigation entry are unchanged.

## Production parsing failure

The old post schema required a category object. The production record with ID 10 has `category: null`, so parsing rejected the entire list.

The schema now accepts exactly object or null; the domain type and normalizer preserve null. Desktop and mobile show **Uncategorized / بدون تصنيف**, without inventing an ID/object or making a category lookup. Existing `published_at: null` support remains.

`blog-posts-null-category.fixture.json` reproduces the exact supplied response excerpt. The complete ten production records were not provided. The integration regression combines that exact record with nine explicitly constructed categorized test records. It proves ten-record parsing, mixed categorized/uncategorized rendering in both UI languages, no generic error and one GET. It does not claim to reproduce the unseen nine production records. The four priority regressions passed before other product/UI changes began.

Other response fields remain validated. Malformed category objects, invalid IDs, non-boolean featured flags and missing required Arabic fields still fail. English response text is optional, but when supplied must be a string.

## Global localization rule and Blog content

Product policy for future feature reviews: all user-facing localizable content across Rafal should support Arabic and English. This correction implements the rule only for Blogs. Identifiers, slugs, emails, phone numbers, URLs and numeric data are not automatically translatable fields.

- Category names remain Arabic/English.
- New post forms require Arabic and English title, excerpt and body, in named language groups with RTL/LTR fields. Content is plain text; no HTML rendering or editor dependency was added.
- GET schemas require the observed Arabic string and allow an optional English string. Legacy Arabic-only content remains valid. No English value is fabricated or copied.
- Lists select the current UI language. If English is absent, the real Arabic title remains visible for identification, explicitly labelled **Arabic · English unavailable**. The inverse fallback is also labelled. Both missing/empty titles use the localized unavailable label.
- Cover and localized title identify each article; reading time is secondary metadata. The desktop columns are Title, Category, Author, Publication date, Featured and Updated. Mobile cards mirror the same information. A technical slug no longer takes the mobile subtitle.
- Publication dates remain factual timestamps. Null displays “No publication date”; future timestamps are not labelled “Published” or assigned an unverified scheduled status.
- Category ID is removed from table/cards and the skeleton. Internal IDs and the supported ID sort remain. Categories have five columns and two mobile timestamp facts; Posts have six columns and five mobile facts.

## Slug contracts

The latest Product Owner correction supersedes prior Arabic-title and omit-slug-on-PUT decisions:

| Operation       | Slug source / submitted value                                        |
| --------------- | -------------------------------------------------------------------- |
| Category Create | Normalize the final validated `name.en`                              |
| Category Edit   | Send the persisted slug captured at drawer initialization, unchanged |
| Post Create     | Normalize the final validated `title.en`                             |

The existing shared `normalizeSlug` is reused unchanged. It performs NFKC normalization, lowercasing, hyphen separation and Unicode letter/number preservation. It does not translate, invent a suffix or timestamp.

Yup derives create slugs from the source, and serializers reject invalid/empty content before HTTP. The category edit handler explicitly overrides the submitted model's slug with the captured persisted value, so changing the English name cannot rename its URL.

There is no manual slug field, preview, or explanatory slug-generation hint. Removed hint keys were unused elsewhere. Invalid source errors use concise text validation. Create duplicate-slug errors map to the English source; immutable edit-slug errors appear as a form alert. Failed submissions retain the draft.

## Optional post category

The Product Owner confirms **Create uses `category_id` containing a category ID**. Index filtering continues to use **`blog_category_id`**; these contracts are separate.

- The form begins unassigned (`categoryId: null`). No `category_id` key is sent in this state, including after clearing a selection.
- Selected values must be positive safe integer numbers. The service sends `category_id = String(id)`, never null, undefined or zero.
- `BlogPostCategorySelect` composes the existing `FormSelect` and category-query hook. Its first keyboard/pointer focus activates fetching; opening/typing elsewhere does not request categories.
- Options paginate lazily, show AR/EN names, and provide loading/empty/error/retry states through the shared selector. Duplicate scroll requests are guarded. A selected ID retains a fallback if absent from loaded options.
- One field-level RHF subscription keeps selection presentation current. No duplicate server state or effect-based fetching is introduced.
- Selection survives other input changes and failed submissions. Backend `category_id` errors map to the selector. Create-another resets it, the bilingual fields and the image.

## Request confidence

| Operation                               | Evidence and implementation                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GET `/dashboard/blog-categories`        | Verified supplied bilingual category envelope, IDs, slugs, dates and metadata; strict validation/normalization retained |
| POST `/dashboard/blog-categories`       | Product Owner requires generated slug; FormData sends `name[ar]`, `name[en]`, `slug`                                    |
| PUT `/dashboard/blog-categories/:id`    | Product Owner now explicitly requires slug; FormData sends persisted `slug` plus both names, response identity checked  |
| DELETE `/dashboard/blog-categories/:id` | Supplied success/message envelope; no deleted entity required                                                           |
| GET `/dashboard/blog-posts`             | Supplied production evidence confirms nullable category and nullable publication; legacy Arabic-only text accepted      |
| POST `/dashboard/blog-posts`            | Sends slug, six localized content fields, author, featured, image File, and optional `category_id`                      |

**Intended but not independently verified:** English multipart keys `title[en]`, `excerpt[en]`, `body[en]` follow the authorized product requirement and existing nested-field convention. Their acceptance and persistence by the live Blog backend still require a successful integration response. The UI implementation is not proof of backend compatibility.

Other isolated assumptions requiring integration verification:

1. Category POST/PUT use repository FormData conventions; native multipart PUT parsing remains unverified. No manual Content-Type boundary or method override is added.
2. Pagination uses the established `page` parameter. Query booleans use shared numeric 1/0; publication filters use YYYY-MM-DD. Exact boolean/date acceptance, bounds/timezone and published-filter semantics remain unverified.
3. Multipart featured values use text '1'/'0', following repository uploads and supplied direction, independently of query encoding.
4. No authoritative Post Create success body was supplied. HTTP success triggers scoped list refresh without inventing a cached entity.
5. Backend upload size, dimension/MIME constraints and additional nullability remain unspecified. Client checks require one nonempty image File; no numerical limits were invented.
6. Unicode/accented slug acceptance has not been live-tested. Ordinary English titles generate the established lowercase hyphenated format.

Unsupported post Show/Edit/Delete/Publish/Unpublish operations and publication-write fields remain absent. No `blog_category_id`, `is_published`, `published_at`, `reading_time_minutes` or `cover_url` is added to Create.

## Cache and regression review

The earlier cache safeguards remain intact: cancel superseded reads before narrow invalidation; retain coherent complete list snapshots; leave ordering/membership/totals to the server; mark dependent post lists stale after category changes. A failed category refresh retains a warning and disables row actions until recovery. Infinite scrolling cannot interrupt refetches or extend failed-refresh snapshots.

Dirty category drafts survive list changes. Mutation locks block duplicate submissions. Failed writes retain inputs/files. Shared image previews are cleaned up on replacement/reset/unmount. No Show lookups, N+1 requests, new HTTP instance, global store or dependencies were introduced.

Changed production files in this correction: post schema/type/service, category schema/service, category drawer/list, post drawer/list, new `BlogPostCategorySelect`, and Blog AR/EN locales. Existing service/form/slug regressions were updated; production-response and presentation regressions and the observed fixture were added.

## Verification

- Latest category-ID contract correction: focused service/form tests passed **46/46 in 2 files**. Coverage includes selected positive IDs, omission without a selection, invalid IDs rejected before HTTP, `category_id` validation errors, retained drafts, and unchanged `blog_category_id` Index serialization.
- TypeScript (`yarn tsc -p tsconfig.app.json --noEmit --pretty false`) and changed-file ESLint (`--max-warnings=0`) passed after this correction.
- Before this final key correction, the broader Blogs and directly affected regression suite passed **152/152 in 19 files**, including locale parity. That broader suite was not rerun after the key correction; the 46 focused tests above were.

The actual full working-tree unified diff, including new/untracked files and preserved earlier consolidation changes, is `artifacts/blogs-review.patch`. Its inclusion of earlier shared changes does not mean those files were modified by this correction.

Live authenticated API behavior, browser E2E and viewport screenshot review are not verified by mocked HTTP/DOM tests.

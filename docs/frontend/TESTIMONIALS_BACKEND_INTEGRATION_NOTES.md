# Testimonials backend integration notes

- Index uses paginated `GET /dashboard/testimonials` with only the standard `page` parameter. Search, filters, and sorting controls are not supported by the current API contract.
- There is no Show endpoint or detail query. Edit captures a complete Index-row snapshot when the drawer opens and hydrates the form from that stable snapshot, so background list refetches cannot overwrite in-progress edits.
- Create uses multipart `POST /dashboard/testimonials` with `name[ar]`, `name[en]`, `title[ar]`, `title[en]`, `comment[ar]`, `comment[en]`, `rating`, `sort_order`, and `is_published`.
- Update uses full-body multipart `PUT /dashboard/testimonials/:id`. Every non-media writable key is resent on every changed save; React Hook Form dirty state controls only whether Update is enabled.
- `is_published` is serialized as `0` or `1`. Rating is required to be a finite number; no undocumented rating range is enforced. Sort order is a required integer and preserves zero; no undocumented bound is enforced.
- `avatar_url` is read-only. The optional `avatar` field is sent only for a newly selected local `File`. An untouched persisted avatar is omitted, a replacement is supported, and persisted-avatar deletion is intentionally unsupported.
- Delete uses bodyless `DELETE /dashboard/testimonials/:id` after an identifying confirmation. Create, Update, and Delete invalidate only Testimonial list queries.
- Structured backend validation errors map to nested React Hook Form fields. A safe backend response message is surfaced when available; otherwise the localized feature fallback is used.

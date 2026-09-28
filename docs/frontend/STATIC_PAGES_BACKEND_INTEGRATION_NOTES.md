# Static Pages backend integration notes

- List uses `GET /dashboard/pages?page=N`; edit loads the authoritative record with `GET /dashboard/pages/:id`.
- Create uses multipart `POST /dashboard/pages`. Update uses native multipart `PUT /dashboard/pages/:id` and includes only dirty fields; it does not use `_method`.
- The Dashboard owns slug normalization for intentionally edited values. Untouched legacy slugs are preserved and omitted from partial updates.
- Localized `title` and `content` values tolerate missing `ar` or `en` keys on reads. The backend's localized requiredness rules are not yet confirmed, so the Dashboard does not invent them and maps backend validation errors to the corresponding fields.
- `is_system` is currently treated as a normal writable boolean. Any additional backend meaning or restrictions for system pages remain unconfirmed.
- There are no confirmed search, filter, delete, publish, or unpublish contracts for this module.

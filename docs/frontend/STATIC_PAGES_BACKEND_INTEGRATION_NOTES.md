# Static Pages backend integration notes

- Index uses `GET /dashboard/pages?page=N`; edit loads the authoritative record first with `GET /dashboard/pages/:id`.
- Create uses multipart `POST /dashboard/pages`. Native multipart `PUT /dashboard/pages/:id` is a full replacement write and does not use `_method`: every save sends `slug`, both localized `title` values, both localized `content` values, and `is_published`.
- Static Page rich text uses the shared Tiptap editor and crosses the domain/API boundary as serialized HTML strings in `content[ar]` and `content[en]`. Stored HTML is not rendered in the Index; server-side sanitization responsibility is not confirmed.
- Create always applies the deterministic one-segment slug normalizer. Edit normalizes an intentionally changed slug, while an untouched legacy slug is resent exactly as returned by Show even though PUT requires the full body.
- Localized `title` and `content` reads tolerate missing `ar` or `en` keys and initialize missing form values as empty strings without translation fallback. Backend localized requiredness remains unconfirmed, so the Dashboard maps backend validation errors without inventing extra rules.
- `is_system` is read-only/server-owned. It remains visible as Index information and in the read model, but Create and Update types, forms, and multipart bodies never include it.
- Delete is intentionally not exposed: the current confirmed Static Pages scope is Index, Show, Create, and Update only. There is no delete service method, hook, action, confirmation UI, test fixture, or delete-specific locale copy.
- Invalid edit IDs do not call Show or expose Retry; they show a localized state linking back to `/dashboard/pages`.
- Update responses may return the complete updated entity. When they do, it replaces the exact detail cache and resets the form; when `data` is absent, the update hook refetches the exact Show query before reset. The deployed response shape has not been browser/API-verified in this change.
- Only page pagination is supported; no search, filter, sort, publish filter, or system filter is implemented.

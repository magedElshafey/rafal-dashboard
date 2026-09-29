# About Us backend integration notes

- About Us is singleton state loaded with `GET /dashboard/about-us` and owned by one TanStack Query detail key.
- Every update uses multipart `POST /dashboard/about-us` with `_method=PUT`, including updates with no files.
- Updates are partial at the top level. Unchanged localized sections, hero media, and the Feature collection are omitted.
- GET responses may contain partial localized objects with only `ar`, only `en`, both keys, or explicit `null` values. Missing read locales remain `null` in the About Us domain and hydrate as empty form strings; the Dashboard never copies one locale into another or fabricates a translation.
- The existing form validation still requires Arabic and English for the hero title/subtitle, story, vision, mission, and every Feature title/subtitle before a successful write. This stricter write rule does not reject historical partial-localized GET data, and the multipart Update contract is unchanged.
- An existing hero URL is retained when `hero` is omitted. A replacement sends only the new local `File`; the remote URL is never re-uploaded.
- Features are ordered complete-replacement data whenever present. Existing Features send their backend `key`; new Features omit it. Removing or reordering changes the submitted collection and its display order.
- The current multipart contract has no defined representation for an explicitly empty Feature replacement. The Dashboard therefore temporarily disables removing the final Feature. This is an API capability constraint, not a permanent minimum-one business rule; supporting zero Features requires the backend to define the empty-collection wire format.
- Existing Feature icon URLs are retained when the indexed `icon` key is omitted. Replacements send only new local files.
- Permanent remote-media deletion depends on the shared `/dashboard/media/:id` flow, but the current About Us response exposes only URLs. Hero and Feature icon deletion is therefore unavailable until the backend supplies concrete media IDs; IDs are never inferred from URLs.

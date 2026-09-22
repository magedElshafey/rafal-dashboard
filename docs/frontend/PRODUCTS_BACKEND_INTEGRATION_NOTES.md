# Products backend integration notes

## Implemented in Milestone 01

Products Index is read-only and paginated through `GET /dashboard/products`. No search or filter query contract is confirmed, so the frontend sends only `page`.

The Index response exposes images as `string[]`. The service uses the first URL as `primaryImageUrl` and uses `null` when the array is empty; it does not derive media IDs from URLs. `base_price` is a string and is normalized to a finite frontend number. Invalid values fail safely instead of becoming zero. Index exposes `category_id` only, so the UI does not fabricate a category name. Index variants are intentionally opaque and currently used only to derive `variantCount`.

`ProductListItem` is the dedicated Index domain model. It is intentionally separate from the future, richer `ProductDetail` contract.

## Confirmed future contracts — not implemented yet

- Product endpoints: `POST /dashboard/products`, `PUT /dashboard/products/:id`, `GET /dashboard/products/:id`, and `DELETE /dashboard/products/:id`.
- Create and Update use `multipart/form-data`.
- Update is partial: an omitted field remains unchanged. To clear a nullable multipart field, send the textual value `"null"`.
- The backend generates `slug`; the frontend does not write it.
- `category_id` is business-required. Temporary API nullability exists only for testing.
- Product Edit uses Show-before-edit.
- Product Show and Variant remote media use `{ id, url }`.
- Newly uploaded Product or Variant images are appended.
- Existing media is deleted through `DELETE /dashboard/media/:id`.
- Variants created after Product creation use dedicated Variant APIs.
- Stocks use dedicated `PUT` and `DELETE` operations.

None of these future Product, Variant, Stock, or media mutation APIs are implemented in Milestone 01.

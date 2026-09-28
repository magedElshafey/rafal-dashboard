# Products backend integration notes

Products are real-API-only. The module uses the shared HTTP client for paginated Index, Show-before-edit, Create, partial Update, Delete, child Variant CRUD, global media deletion, and Variant Warehouse Stock writes. Categories and Warehouses reuse their existing paginated queries; no per-row requests are introduced.

Product Create and Update use JSON when no files are present and `multipart/form-data` only when appending new images. Update sends only dirty Product fields. Existing remote images are omitted and remain untouched; only newly added `File` objects are repeated as `images[]`. Remote media uses `DELETE /dashboard/media/:id`, while removal of an unsaved local image is client-only.

The backend may technically tolerate `category_id: null`, and Product read models defensively accept null for legacy records. The Rafal Dashboard business flow does not: Category is required in both Product Create and Edit, validation requires a valid backend Category ID, and write payloads never intentionally create or save an uncategorized Product.

Slug is backend-owned. Frontend must never send slug in Create/Update requests. The frontend also never writes `base_price_incl_vat`, simulated counters, Category slug, Variants, or Stocks through Product Save. Product, Variant, Stock, and media lifecycles remain independent transactions.

Product Detail defensively normalizes numeric strings, boolean representations, empty-array descriptions, category data, media, Variants, and Stocks. Product detail cache owns the nested resources. Product Update replaces authoritative detail and invalidates lists; child mutations surgically change the targeted nested resource. Product and Variant Delete invalidate lists only where Index counts can change. Media and Stock mutations avoid unrelated list invalidation.

Variant Create and partial Update use JSON without files and multipart only for new `images[]`. Editable fields are trimmed SKU, dynamic `attributes`, nullable `price_override`, numeric `is_active`, and new images. Stock is never nested. Clearing an override sends JSON `price_override: null` when there are no new files, or multipart `price_override="null"` when new images are appended in the same request. Update omits unchanged fields and sends only changed/additional attribute keys because backend attribute semantics are MERGE. Variant Delete has no body. Existing free-form scalar, array, flat, or nested attribute JSON remains readable without crashing.

The exact per-key wire representation for deleting an existing Variant attribute is not documented. Edit therefore locks existing keys, supports value changes and additions, preserves complex legacy JSON, and does not invent null or empty-string deletion behavior.

Variant Stock uses quantity-only JSON at `PUT /dashboard/products/:product/variants/:variant/stocks/:warehouse`; zero is valid. If success contains no Stock object, the submitted Warehouse ID and quantity update detail cache. DELETE uses the same resource URL without a body. Duplicate Warehouse assignment is prevented in the UI while the backend remains authoritative.

## Canonical Web/Flutter option model

The planned Product-level `variant_attributes` model contains dynamic stable keys, localized Arabic/English labels, presentation (`color_swatch`, `text_swatch`, `dropdown`, or `image_swatch`), and values with stable machine codes, localized labels, and optional color/image visuals. Variants store only selected codes in `attributes`. Applications never translate machine codes, and color visuals never replace accessible localized text labels.

Backend acceptance/return of `variant_attributes` is not documented or implemented in the current repository contract, so the frontend does not send it. Types are isolated for later adoption without coupling current Variant CRUD to hardcoded color, size, or material keys.

## Remaining backend contracts

- Product-level persistence and response shape for `variant_attributes`.
- Exact per-key Variant attribute deletion representation.
- Discount datetime timezone semantics.

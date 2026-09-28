# Categories backend integration notes

The Categories frontend uses the real dashboard API through the shared authenticated HTTP client.

Category Create requires exactly one local image and submits multipart form data under the `image` key. Category Edit displays the existing `image_url`; omitting `image` keeps that remote image, while selecting a replacement submits one local `File` under `image`. The frontend does not download, recreate, or separately delete the existing image.

Slug is backend-owned. Frontend must never send slug in Create/Update requests.

## Contract gaps requiring backend confirmation

1. The create example returns `description: []`, while index/show return a localized `{ ar, en }` object. The frontend normalizes arrays and empty values to `null`.
2. The create example returns `parent_id` as a string, while index/show use `number | null`. The service normalizes it to `number | null`.
3. The create example returns `sort_order` as a string, while index/show use a number. The service normalizes it to `number`.
4. The screenshot labels the description request as `description[]`, which does not define bilingual keys. Pending confirmation, the service sends non-empty descriptions as `description[ar]` and `description[en]` and omits an entirely empty description.
5. Only direct self-parenting can be prevented from the paginated collection. Full descendant-cycle validation remains a backend responsibility until a complete hierarchy endpoint is available.

The flat paginated endpoint is not sufficient for a recursive tree or drag-and-drop ordering UI. Those experiences require a complete hierarchy and explicit reordering contract.

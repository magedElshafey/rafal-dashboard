# Categories backend integration notes

The Categories frontend models the current documented contract while isolating unresolved transport details in the category service.

## Contract gaps requiring backend confirmation

1. Responses expose `image_url`, but the provided create request has no image field. Confirm the upload field name, create/update support, and replacement/removal semantics. Until then, the UI displays remote images but does not render or submit an image editor.
2. The create example returns `description: []`, while index/show return a localized `{ ar, en }` object. The frontend normalizes arrays and empty values to `null`.
3. The create example returns `parent_id` as a string, while index/show use `number | null`. The service normalizes it to `number | null`.
4. The create example returns `sort_order` as a string, while index/show use a number. The service normalizes it to `number`.
5. The screenshot labels the description request as `description[]`, which does not define bilingual keys. Pending confirmation, the service sends non-empty descriptions as `description[ar]` and `description[en]` and omits an entirely empty description.
6. The contract exposes `slug` as a write field but does not state whether it is required or server-generated. Pending confirmation, the form requires the user to enter it and does not generate or mutate it.
7. Only direct self-parenting can be prevented from the paginated collection. Full descendant-cycle validation remains a backend responsibility until a complete hierarchy endpoint is available.

The flat paginated endpoint is not sufficient for a recursive tree or drag-and-drop ordering UI. Those experiences require a complete hierarchy and explicit reordering contract.

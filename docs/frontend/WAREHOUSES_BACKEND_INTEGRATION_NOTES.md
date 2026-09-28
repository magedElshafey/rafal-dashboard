# Warehouses backend integration notes

Warehouses use the real backend exclusively through the shared HTTP client. The Index endpoint is paginated, and Edit always loads the complete Warehouse with `GET /dashboard/warehouses/:id` before rendering editable city assignments.

Create and partial Update use `application/json`. Frontend booleans remain `boolean`, while `is_active` writes use numeric `0 | 1`. Create requires `city_ids`; the former free-text coverage field is absent from the frontend model and request contract.

On Update, omitted fields remain unchanged. When `city_ids` is present it replaces the Warehouse's complete city assignment, so a changed selection sends every currently selected City ID rather than an added/removed delta. An unchanged selection omits `city_ids`.

The backend owns cross-Warehouse city uniqueness. Assignment conflicts preserve the form and selected cities while showing localized corrective feedback. Delete can be rejected while the Warehouse still owns Product Variant stock; the row and confirmation remain available so the user can clear stock and retry.

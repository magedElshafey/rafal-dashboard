# Cities backend integration notes

Confirmed contracts are `GET /dashboard/cities`, `POST /dashboard/cities`, `PUT /dashboard/cities/:id`, and `DELETE /dashboard/cities/:id`. Create uses JSON with `region_id`, localized `name`, `is_active`, optional `sort_order`, and required `boundary` and `center`. The production form does not submit without completed geography. Backend responses remain nullable because temporary test-compatible records without geography still exist.

The provided create response repeats the first boundary point at the end, indicating that the backend closes the polygon ring. The frontend keeps only user-entered ordered points and does not add a closing point before submission. The mock closes its response ring without mutating the submitted payload.

Create invalidates City lists and Region lists because the documented Region `cities_count` aggregate changes.

Update uses `multipart/form-data` and supports partial updates. Writable fields are `region_id`, `name[ar]`, `name[en]`, `is_active`, `sort_order`, `center[lat]`, `center[lng]`, and indexed `boundary[n][lat]` / `boundary[n][lng]`. Omitted fields remain unchanged. React Hook Form dirty state selects changed domain fields; the service maps them to wire keys and serializes center and boundary atomically. The complete updated City response is authoritative.

The Edit drawer intentionally remains row-backed because the index response already contains its complete contract. A City Show endpoint exists but is not yet ready or integrated; show-before-edit can be revisited after it stabilizes. Edit hydrates cloned values and opens a backend-closed polygon ring for frontend/map state. A Region change invalidates both City and Region lists because it changes Region `cities_count`; all other updates invalidate only City lists.

City center and boundary are required business fields for Create and Edit. Clearing either makes the form invalid until a replacement is supplied; Update never serializes null or empty geography as a clearing operation. Legacy nullable response rows open safely and require the missing geography before any update can be submitted.

Delete sends `DELETE /dashboard/cities/:id` with no request body. It invalidates City and Region lists because deletion changes the Region `cities_count` aggregate.

There is no confirmed City delete constraint in the BRD. The frontend allows Delete, relies on the backend as authoritative, and uses safe generic failure feedback if rejected.

Pending backend confirmation:

1. Exact backend minimum polygon-point validation.
2. Whether the center must be inside the boundary.
3. Polygon self-intersection validation.
4. Coordinate precision constraints.

The Admin now selects geography through the interactive map, while Laravel continues to receive the documented `center` and `boundary` coordinate structures. MapLibre, Terra Draw, GeoJSON, and the configured map provider do not enter the City API contract.

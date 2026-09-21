# ADR: map-first geographic editing

## Decision

Use MapLibre GL JS as the renderer, Terra Draw with its official MapLibre adapter for polygon drawing and vertex editing, and the OpenFreeMap public Liberty style as the current map source. City creation presents the map as the primary geography workflow and keeps the structured coordinate editor collapsed under **Advanced Coordinates**.

The dependency boundary is:

`CityForm` → `FormLocationMap` → `LocationMapEditor` → MapLibre / Terra Draw → configured map style

## Data ownership

React Hook Form remains authoritative for `center: Coordinate | null` and `boundary: Coordinate[]`. The map keeps interaction mode and in-progress drawing details only. GeoJSON is an internal adapter format: domain `{ lat, lng }` values convert to GeoJSON `[lng, lat]`, the adapter closes polygon rings, and reverse conversion removes the duplicated closing point. City service JSON and Laravel field names are unchanged.

## Provider configuration and operations

- Current provider: OpenFreeMap public infrastructure.
- Default style: `https://tiles.openfreemap.org/styles/liberty`.
- Configuration: `VITE_MAP_STYLE_URL`.
- Development fallback: the same centralized Liberty URL when the variable is empty.
- OpenFreeMap currently requires no key or registration and has no per-map-view billing; required map/source attribution remains enabled.
- This is a public external service and no SLA is assumed. A commercial provider or self-hosted tiles may offer stronger operational guarantees later, and can be selected by configuration without changing City forms.

Map/style failures stay inside the geography UI with a retry action. The synchronized Advanced Coordinates editor remains usable when the external map is unavailable.

For the Saudi Arabia MVP, the shared map infrastructure owns a padded Saudi navigation extent, minimum zoom, default camera, and disabled world copies. These constraints limit navigation without turning the camera into a City center or coupling City forms to Saudi coordinates. A future selected-country configuration can replace this shared constraint without changing `LocationMapEditor` consumers.

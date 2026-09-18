# Warehouses backend integration notes

The implemented contract represents coverage as user-editable free-text strings sent as repeated `coverage_zone[]` multipart fields. Product/backend clarification is required on whether the final model should reference managed City or Region IDs/entities, because the BRD separately requires Regions, Cities, and warehouse coverage management.

Please also confirm whether `coverage_zone` is required, whether values must be unique, whether Arabic and English variants are intentionally separate values, and whether duplicate comparison should be case-insensitive. Until clarified, coverage is optional, whitespace is trimmed, empty entries are prevented, and only exact duplicates are rejected.

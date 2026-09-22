# ADR-PRODUCT-001: Product Management Workflow and Resource Boundaries

## Status

Accepted

## Context

Products are complex resources involving product information, pricing and discounts, personalization, media, variants, variant media, and warehouse stocks. The backend exposes separate lifecycles for Product, Variant, Stock, and media deletion. Product Create technically supports nested initial Variants and Stocks.

## Decision

This is a frontend workflow decision.

1. Product Create and Edit will use full pages at the future routes `/dashboard/products/new` and `/dashboard/products/:id/edit`.
2. Product Create in the Dashboard MVP creates Product data only. The frontend will not initially create nested Variants or Stocks within the Product Create request.
3. After Product creation, the frontend will navigate to Product Edit.
4. Product Edit will use Show-before-edit through `GET /dashboard/products/:id`.
5. Variant mutations remain dedicated child-resource mutations.
6. Stock mutations remain dedicated mutations.
7. Existing media deletion remains `DELETE /dashboard/media/:id`.
8. Product Save saves Product fields only. The frontend will not provide a “Save Everything” pseudo-transaction across Product, Variant, Stock, and media deletion.

## Reasons

- Aligns UI transactions with backend resource boundaries.
- Prevents a giant Product drawer.
- Avoids deeply nested multipart complexity.
- Reduces partial-failure risk.
- Simplifies validation and error ownership.
- Improves mobile UX, testing, and maintainability.
- Enables Product, Variant, and Stock workflows to evolve independently.

## Alternatives

### A. Giant Product Drawer

Rejected because the resource and its child workflows are too complex for one drawer.

### B. Product Create with nested Product, Variants, and Stocks

The backend supports this, but it is intentionally deferred in the Dashboard MVP.

### C. Frontend Save Everything orchestration

Rejected because independent API calls could partially fail and do not form one backend transaction.

## Consequences

The frontend has clearer resource boundaries, simpler failure recovery, and more focused testing and maintenance. Creating a Product with variants may require additional admin steps.

This decision may be revisited if Product requirements explicitly require one-step creation later.

# ADR-PRODUCT-001: Product Management Workflow and Resource Boundaries

## Status

Accepted — Amended for Aggregate Product Create. Product Edit retains the dedicated resource boundaries below.

## Context

Products are complex resources involving product information, pricing and discounts, personalization, media, variants, variant media, and warehouse stocks. The backend exposes separate lifecycles for Product, Variant, Stock, and media deletion. Product Create technically supports nested initial Variants and Stocks.

## Decision

This is a frontend workflow decision.

1. Product Create and Edit will use full pages at the future routes `/dashboard/products/new` and `/dashboard/products/:id/edit`.
2. Product Create uses one full-page form and one aggregate multipart request containing Product data, required Product images, Variants, flat attributes, and Stocks.
3. After aggregate Product creation, the frontend navigates to Product Edit using the returned Product ID.
4. Product Edit will use Show-before-edit through `GET /dashboard/products/:id`.
5. Variant mutations remain dedicated child-resource mutations.
6. Stock mutations remain dedicated mutations.
7. Existing media deletion remains `DELETE /dashboard/media/:id`.
8. Product Edit Save saves Product fields only. The frontend does not provide a “Save Everything” pseudo-transaction across existing Product, Variant, Stock, and media deletion resources.

## Reasons

- The verified aggregate endpoint aligns the required one-submit UX with one backend write.
- Backend validation owns aggregate consistency; the frontend maps nested errors to exact fields.
- The full-page form avoids a giant Product drawer and keeps responsive sections explicit.
- Product Edit, Variant, Stock, and media workflows can still evolve independently.

## Alternatives

### A. Giant Product Drawer

Rejected because the resource and its child workflows are too complex for one drawer.

### B. Product Create with nested Product, Variants, and Stocks

Accepted after runtime verification of the aggregate multipart contract. Aggregate Variant images remain outside the verified Create contract.

### C. Frontend Save Everything orchestration

Rejected because independent API calls could partially fail and do not form one backend transaction.

## Consequences

Product Create now submits Product data, required Product images, Variants, attributes, and Stocks together. Product Edit retains dedicated resource mutations. The frontend does not orchestrate child writes or claim client-side transaction semantics.

Collapsible Variant subsections remain deferred P2 UX scalability work and are not part of the aggregate Create implementation.

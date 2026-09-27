# Rafal — Admin & Warehouse Dashboard

<p align="center">
  <strong>Operational dashboards for managing Rafal's e-commerce products, orders, customers, inventory, content, and warehouse workflows.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/Status-In_Development-orange" alt="Status: In Development" />
</p>

---

## Overview

This repository contains the **Rafal Admin & Warehouse Dashboard**, the operational frontend used to manage the wider Rafal e-commerce platform.

Built with **React, TypeScript, Vite, TanStack Query, Zustand, React Hook Form, and Tailwind CSS**, the dashboard supports internal commerce and warehouse workflows while keeping operational interfaces separate from the customer-facing Next.js storefront.

---

## Current Platform Scope

### Commerce Administration

The admin experience is designed around operational workflows such as:

- Product management
- Category management
- Order management
- Customer management
- Coupons and promotions
- Content management
- Regions and cities
- Warehouse configuration

### Warehouse Operations

Warehouse-facing workflows support the operational side of commerce, including:

- Inventory visibility
- Order fulfillment workflows
- Shipping-related operations
- Warehouse-aware product and order handling

### Authentication & Protected Areas

The application includes:

- Login flow
- Authenticated dashboard routes
- Centralized route protection
- Session handling
- Shared HTTP authentication behavior

A development-only authentication bypass is available locally while backend authentication contracts are being integrated. Production builds do not use this bypass.

---

## Dashboard Architecture

### Server State

**TanStack Query** manages API-driven data and asynchronous state, providing consistent patterns for loading, errors, caching, invalidation, and refetching.

### Client State

**Zustand** is used for client-side application state where server-state tooling is not appropriate.

### Forms & Validation

Forms are built with:

- React Hook Form
- Zod / Yup where required
- Reusable field and validation patterns

### API Layer

The dashboard uses **Axios** through a shared HTTP client to centralize API communication and authentication behavior.

### Internationalization & Direction

The application uses i18next / react-i18next, with Arabic as the default locale and document-level RTL/LTR direction updates when switching language.

### Dashboard UI

The shared application shell includes:

- Responsive sidebar
- Top navigation
- Main content region
- Persisted theme preferences
- Reusable UI primitives

---

## Quality Tooling

The repository includes a stronger frontend quality workflow with:

- ESLint
- TypeScript type checking
- Prettier
- Vitest
- Testing Library
- Husky
- lint-staged
- Commitlint

Available validation commands include:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn format:check
```

---

## Tech Stack

| Area | Technologies |
| --- | --- |
| Core | React 19, TypeScript, Vite |
| Server State | TanStack Query |
| Client State | Zustand |
| API | Axios |
| Forms | React Hook Form |
| Validation | Zod, Yup |
| UI | Tailwind CSS 4, Radix UI |
| Routing | React Router |
| Internationalization | i18next, react-i18next |
| Charts | Recharts |
| Testing | Vitest, Testing Library |
| Quality | ESLint, Prettier, Husky, lint-staged, Commitlint |

---

## Planned Platform Integrations

The Rafal ecosystem includes planned integrations with systems such as:

- **Odoo ERP**
- Payment services
- Shipping providers
- Supporting commerce services

These are part of the broader platform roadmap and are not presented here as completed integrations unless explicitly implemented.

---

## What This Project Demonstrates

- Complex React + TypeScript dashboard development
- Admin and warehouse workflow design
- API-heavy operational interfaces
- Server-state and client-state separation
- Authentication and protected-route architecture
- Arabic / RTL dashboard support
- Reusable form infrastructure
- Frontend testing and quality tooling
- Maintainable internal-product architecture

---

## Local Development

1. Configure `VITE_API_BASE_URL` in `.env`.
2. Install dependencies:

```bash
yarn install --frozen-lockfile
```

3. Start the application:

```bash
yarn dev
```

Core routes include `/login` and authenticated `/dashboard`.

---

## Project Status

**Currently in development.**

This repository represents the operational dashboard side of the Rafal e-commerce platform.

---

## About Me

I'm **Maged Elshafey**, a Frontend Engineer focused on production web applications built with React, TypeScript, and Next.js.

- LinkedIn: https://www.linkedin.com/in/maged-elshafey/
- GitHub: https://github.com/magedElshafey

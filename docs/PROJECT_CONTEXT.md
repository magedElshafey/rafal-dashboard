# Rafal Dashboard project context

## Current purpose

This repository is the clean React foundation for the Rafal Admin Dashboard. It currently provides authentication, a protected dashboard landing page, shared UI primitives, React Query infrastructure, localization, RTL support, and testing infrastructure.

Rafal business modules and role/permission rules are intentionally not defined yet. They must be implemented from approved backend and product contracts.

## Core application flow

- `/` redirects through the protected dashboard entry.
- `/login` is the single unauthenticated entry.
- `/dashboard` is the neutral authenticated landing page.
- All API requests go through `$http`, backed by the single Axios instance in `src/config/axios.ts` and `VITE_API_BASE_URL`.

## Technology

The project uses React, TypeScript, Vite, React Router, TanStack React Query, Zustand, React Hook Form, Yup, Tailwind CSS, Axios, react-i18next, Vitest, React Testing Library, and jsdom.

English and Arabic resources are assembled in `src/lang/resources.ts`; `src/config/i18.ts` preserves document language and direction.

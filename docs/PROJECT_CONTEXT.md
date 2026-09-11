# Smart Hub project context

## Product purpose

Smart Hub is a multilingual learning-management frontend. It presents course content, assignments, exams, tasks, reports, notifications, profile data, and live-session experiences to authenticated users. Separate teacher-facing modules cover administrative and instructional workflows.

## Portals and roles

The application has two authenticated route roots:

- `/user` supports the `student` and `parent` roles.
- `/teacher` supports the `teacher`, `admin`, and `assistant` roles.

`RoleGuard` protects each portal. Feature routes that support a narrower role set use `RoleOnly`, which delegates to the same `RoleAccess` behavior and redirects unauthorized users to the existing error routes.

Student and Parent experiences are not interchangeable. In particular, the Tasks dashboard is Student-only, while Parent users retain approved access to Assignment and Exam list/detail actions described in `BUSINESS_RULES.md`.

## Major frontend areas

The `src/modules` directory currently contains:

- Authentication.
- User experiences such as Home, Course, Library, Tasks, Assignments, Exams, To-Do List, Notifications, Profile, reports, and shared meeting/PDF behavior.
- Teacher, Admin, and Assistant experiences.
- Shared dashboard and error modules.

Reusable UI lives primarily under `src/components`, grouped into core layout/navigation primitives, form controls, shared dashboard/query-state behavior, and shadcn/Radix-based UI components.

## Technology

The checked-in package configuration uses:

- React 19 and TypeScript.
- Vite 6.
- React Router 6.
- TanStack React Query 5.
- Zustand for client/auth state.
- React Hook Form and Yup for forms.
- Tailwind CSS 4 with project design tokens.
- Radix/shadcn UI components.
- Axios through project HTTP wrappers.
- react-i18next.
- Vitest, React Testing Library, and jsdom.

## Localization

English and Arabic resources are assembled in `src/lang/resources.ts`. `src/config/i18.ts` configures the supported languages, updates the document language/direction, and supplies translated Yup defaults. Feature copy belongs in feature locale files and must be registered in the shared resource map. Layouts and directional icons must work in both LTR and RTL.

## Server state

TanStack React Query is the authoritative store for backend data. The shared query client defines default stale/GC behavior and disables window-focus refetching. Feature hooks may override retry and freshness settings when the endpoint requires a different policy. Services use `$http` or the appropriate authenticated project wrapper; components do not call Axios directly.

List modules use query-key factories and, where applicable, `useInfinitePaginatedQuery` plus `useInfiniteScroll`. Mutations reconcile narrowly scoped caches and must not use page reloads as a synchronization mechanism.

# Rafal Dashboard

React and TypeScript foundation for the Rafal Admin Dashboard.

## Local development

1. Set `VITE_API_BASE_URL` in `.env` to the Rafal backend API root.
2. Install the pinned dependencies with `yarn install --frozen-lockfile`.
3. Start the application with `yarn dev`.

The core routes are `/login` and the authenticated `/dashboard`. API calls use the shared `$http` client in `src/utils/http.ts`.

### Temporary authentication bypass

`VITE_AUTH_BYPASS=true` allows unauthenticated access to `/dashboard` during local development while the Laravel authentication contract is unavailable. The bypass is centralized in `RequireAuth`; the auth store, login/logout flow, session handling, and HTTP authentication remain active and unchanged.

Set `VITE_AUTH_BYPASS=false` (or remove the variable) to restore normal route protection. Production builds always ignore the bypass, even if the variable is accidentally set.

## Validation

```sh
yarn lint
yarn typecheck
yarn test
yarn build
yarn format:check
```

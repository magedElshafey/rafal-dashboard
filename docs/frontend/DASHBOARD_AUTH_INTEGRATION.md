# Dashboard authentication

- The dashboard signs in with `POST /dashboard/auth/login` using multipart fields `email` and `password`.
- The frontend persists only the normalized admin identity, admin roles, and Laravel personal-access token in local storage.
- The shared Axios request interceptor adds the session token as `Authorization: Bearer <token>`; feature modules must not read auth storage or add this header themselves.
- A protected request returning `401` clears the auth session and user-specific TanStack Query cache, then returns the browser to Login. Login failures do not trigger this redirect loop.
- A `403` does not clear or invalidate the authenticated session.
- The backend has no `/me` endpoint, refresh token, or logout/revoke endpoint. A persisted stale token is therefore accepted until the first protected API request returns `401`.
- Logout is client-side only: it clears the local session and query cache and navigates to Login. The server token remains valid until the backend expires or revokes it.

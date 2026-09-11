# LMS Frontend Auth, Portal, Role, Routing, and API Architecture

This document explains how authentication, portals, roles, route protection, and dynamic API base URLs work in this LMS frontend project.

It is intended for developers and AI agents working on the codebase.

---

## 1. Core Idea

The system is **portal-based** and **role-based**.

We do not have permissions.

We only have roles.

There are two main portals:

```txt
/users
/teachers
```

Each portal has its own login endpoint, login page, root route, and home page.

After login, the backend returns a `role`, and the frontend uses this role to:

1. Store the authenticated session.
2. Redirect the user to the correct portal home.
3. Select the correct API base path.
4. Protect routes from unauthorized roles.
5. Render role-specific UI when needed.

---

## 2. Portals

A portal is the main entry point and route group.

Current portals:

```ts
type AuthPortal = 'users' | 'teachers'
```

### Users Portal

Used for:

```txt
student
parent
```

Routes:

```txt
/users/login
/users/home
/users/*
```

Auth endpoint:

```txt
/api/users/v1/auth
```

### Teachers Portal

Used for:

```txt
teacher
admin
assistant
```

Routes:

```txt
/teachers/login
/teachers/home
/teachers/*
```

Auth endpoint:

```txt
/api/teachers/v1/auth
```

---

## 3. Roles

Current roles:

```ts
type UserRole = 'student' | 'parent' | 'teacher' | 'admin' | 'assistant'
```

The backend returns the role after login.

Example users login response:

```json
{
  "token": "TOKEN",
  "role": "student",
  "user": {
    "id": 1,
    "name": "Ahmed",
    "phone": "01000000000"
  }
}
```

Example teachers login response:

```json
{
  "token": "TOKEN",
  "role": "admin",
  "user": {
    "id": 7,
    "name": "Admin Name",
    "phone": "01000000000"
  }
}
```

---

## 4. Important Rule

Portal controls login and route grouping.

Role controls API base path and access.

```txt
Portal = where the user logs in and which route group they belong to.
Role   = what API base path and access rules the user gets after login.
```

---

## 5. File Responsibilities

### `portal.config.ts`

This file contains anything shared by all roles inside the same portal.

It should contain:

```txt
rootPath
loginPath
homePath
authEndpoint
allowedRoles
```

Example:

```ts
PORTAL_CONFIG.users.rootPath // /users
PORTAL_CONFIG.users.loginPath // /users/login
PORTAL_CONFIG.users.homePath // /users/home
PORTAL_CONFIG.users.authEndpoint // /api/users/v1/auth
```

Do not duplicate these values inside every role.

---

### `role.config.ts`

This file contains role-specific information only.

It should contain:

```txt
portal
apiBasePath
optional homePath override only if a role needs a special landing page
```

Example:

```ts
ROLE_CONFIG.student.apiBasePath // /api/users/student
ROLE_CONFIG.parent.apiBasePath // /api/users/parent
```

The default home page should come from the portal.

Only add `homePath` inside a role if that specific role must land somewhere different.

Example:

```ts
assistant: {
  portal: 'teachers',
  apiBasePath: '/api/teachers/assistant',
  homePath: '/teachers/submissions',
}
```

---

### `auth.helpers.ts`

This file connects portal config and role config.

Use helpers instead of accessing config objects directly everywhere.

Main helpers:

```ts
getPortalByRole(role)
getHomePathByRole(role)
getLoginPathByRole(role)
getLoginPathByPortal(portal)
getApiBasePathByRole(role)
isRoleAllowedInPortal(portal, role)
getLoginPathByPathname(pathname)
```

Example:

```ts
getHomePathByRole('student') // /users/home
getHomePathByRole('parent') // /users/home
getHomePathByRole('teacher') // /teachers/home
```

---

## 6. Login Flow

### Users Login

Page:

```txt
/users/login
```

Portal:

```ts
'users'
```

Endpoint:

```txt
/api/users/v1/auth
```

Allowed backend roles:

```txt
student
parent
```

Flow:

```txt
User submits phone/password
→ frontend calls /api/users/v1/auth
→ backend returns token + role + user
→ frontend validates role belongs to users portal
→ frontend stores token, role, portal, userData
→ frontend redirects to /users/home
```

---

### Teachers Login

Page:

```txt
/teachers/login
```

Portal:

```ts
'teachers'
```

Endpoint:

```txt
/api/teachers/v1/auth
```

Allowed backend roles:

```txt
teacher
admin
assistant
```

Flow:

```txt
User submits phone/password
→ frontend calls /api/teachers/v1/auth
→ backend returns token + role + user
→ frontend validates role belongs to teachers portal
→ frontend stores token, role, portal, userData
→ frontend redirects to /teachers/home
```

---

## 7. Auth Store

The Zustand auth store stores:

```ts
token: string | null
role: UserRole | null
portal: AuthPortal | null
userData: IUser | null
isAuthenticated: boolean
```

Stored values are saved in either:

```txt
localStorage
```

or:

```txt
sessionStorage
```

depending on `rememberMe`.

Stored keys:

```txt
token
role
portal
userData
```

The store is responsible for:

```txt
login
logout
setAuth
updateUserData
hydrating auth state from storage
clearing invalid sessions
```

---

## 8. Why Store Both Role and Portal?

The role is needed for:

```txt
API base path
route access
role-specific rendering
```

The portal is needed for:

```txt
login redirect after 401
knowing the original login area
portal-based route handling
```

Example:

If a teacher session expires, the user should go back to:

```txt
/teachers/login
```

not:

```txt
/users/login
```

---

## 9. Dynamic API Base URL

There are two Axios instances:

### `auth-axios.ts`

Used only before authentication.

Used for login.

It always uses:

```ts
env.API_BASE
```

Example final URL:

```txt
{API_BASE}/api/users/v1/auth
{API_BASE}/api/teachers/v1/auth
```

---

### `axios.ts`

Used after authentication.

It dynamically builds the base URL based on the current role.

Example:

```ts
$http.get({ url: '/home' })
```

If role is `student`, final request becomes:

```txt
{API_BASE}/api/users/student/home
```

If role is `parent`, final request becomes:

```txt
{API_BASE}/api/users/parent/home
```

If role is `admin`, final request becomes:

```txt
{API_BASE}/api/teachers/admin/home
```

---

## 10. Never Hardcode Role API Paths in Feature Code

Do not do this:

```ts
axios.get('/api/users/student/home')
```

Do this:

```ts
$http.get({ url: '/home' })
```

The Axios interceptor is responsible for adding the correct role-based API prefix.

---

## 11. Route Architecture

Routes are portal-based, not role-based.

Use:

```txt
/users/home
/users/courses
/users/exams
/users/reports

/teachers/home
/teachers/courses
/teachers/exams
/teachers/students
```

Do not create separate route groups unless really needed:

```txt
/student/home
/parent/home
/teacher/home
/admin/home
/assistant/home
```

The preferred architecture is:

```txt
portal-based routes
role-based access
role-based rendering when needed
dynamic role-based API base URL
```

---

## 12. Route Guards

### `RoleGuard`

Used to protect route branches.

Example:

```tsx
{
  path: '/users',
  element: <RoleGuard allowedRoles={['student', 'parent']} />,
  children: [
    {
      path: 'home',
      element: <UsersHomePage />,
    },
  ],
}
```

Example:

```tsx
{
  path: '/teachers',
  element: (
    <RoleGuard allowedRoles={['teacher', 'admin', 'assistant']} />
  ),
  children: [
    {
      path: 'home',
      element: <TeachersHomePage />,
    },
  ],
}
```

---

### `RoleOnly`

Used inside routes or components when a specific page/section is only for specific roles.

Example:

```tsx
<RoleOnly allowedRoles={['admin']}>
  <ImportStudentsPage />
</RoleOnly>
```

Example inside teachers routes:

```tsx
{
  path: 'import-students',
  element: (
    <RoleOnly allowedRoles={['admin']}>
      <ImportStudentsPage />
    </RoleOnly>
  ),
}
```

---

## 13. 401 and 403 Handling

### 401 Unauthorized

Means:

```txt
token missing
token expired
not authenticated
```

Frontend behavior:

```txt
logout
clear auth storage
redirect to the correct portal login page
```

If portal is `users`:

```txt
/users/login
```

If portal is `teachers`:

```txt
/teachers/login
```

---

### 403 Forbidden

Means:

```txt
authenticated but role is not allowed
```

Frontend behavior:

```txt
redirect to /403
```

---

## 14. UI Rendering Strategy

Because many pages are shared inside the same portal, use shared portal pages.

Example:

```txt
/users/home
```

can be used by both:

```txt
student
parent
```

If the UI is almost the same, keep one page and use small role-based sections.

Example:

```tsx
{
  role === 'parent' && <ParentOnlySection />
}
{
  role === 'student' && <StudentOnlySection />
}
```

If the UI is moderately different but the route should remain the same, use a view registry.

Example:

```tsx
const HOME_VIEW_BY_ROLE = {
  student: StudentHomeView,
  parent: ParentHomeView,
} as const

const HomeView = HOME_VIEW_BY_ROLE[role]

return <HomeView />
```

For teachers portal:

```tsx
const HOME_VIEW_BY_ROLE = {
  teacher: TeacherHomeView,
  admin: AdminHomeView,
  assistant: AssistantHomeView,
} as const
```

---

## 15. When to Split Pages

Use one shared page when:

```txt
same portal
same business page
same navigation item
UI differences are small or medium
```

Split into separate views when:

```txt
same route but UI differs significantly
```

Example:

```txt
modules/users/views/StudentHomeView.tsx
modules/users/views/ParentHomeView.tsx
```

Split into a separate route only when:

```txt
the feature exists for one role only
the flow is completely different
the URL should represent a unique feature
```

Example:

```txt
/teachers/import-students
```

This may be admin-only.

---

## 16. Suggested Folder Structure

```txt
src/
  config/
    portal.config.ts
    role.config.ts
    auth.helpers.ts
    axios.ts
    auth-axios.ts
    env.ts

  store/
    auth/
      index.ts

  modules/
    auth/
      types/
        auth.types.ts
      pages/
        UsersLoginPage.tsx
        TeachersLoginPage.tsx

    users/
      layout/
        UsersLayout.tsx
      pages/
        UsersHomePage.tsx
        UsersCoursesPage.tsx
        UsersExamsPage.tsx
      views/
        StudentHomeView.tsx
        ParentHomeView.tsx

    teachers/
      layout/
        TeachersLayout.tsx
      pages/
        TeachersHomePage.tsx
        TeachersCoursesPage.tsx
        TeachersExamsPage.tsx
      views/
        TeacherHomeView.tsx
        AdminHomeView.tsx
        AssistantHomeView.tsx

  app/
    router/
      guards/
        RoleGuard.tsx
        RoleOnly.tsx

  utils/
    http.ts
    auth-http.ts
```

---

## 17. Adding a New Role

To add a new role:

1. Add it to `USER_ROLES`.
2. Add it to `UserRole`.
3. Add it to the correct portal `allowedRoles`.
4. Add it to `ROLE_CONFIG`.
5. Update route guards if needed.
6. Update UI view registries if needed.

Example:

```ts
export const USER_ROLES = ['student', 'parent', 'teacher', 'admin', 'assistant', 'admin'] as const
```

Then:

```ts
admin: {
  portal: 'teachers',
  apiBasePath: '/api/teachers/admin',
}
```

---

## 18. Adding a New Portal

To add a new portal:

1. Add it to `AUTH_PORTALS`.
2. Add it to `AuthPortal`.
3. Add a new entry in `PORTAL_CONFIG`.
4. Assign roles to it in `ROLE_CONFIG`.
5. Add login page.
6. Add route branch.
7. Update layouts/navigation if needed.

---

## 19. Common Mistakes to Avoid

Do not put `loginPath` inside `role.config.ts` unless there is a very strong reason.

`loginPath` belongs to portal config.

Do not put `homePath` in every role if all roles in the same portal share the same home page.

`homePath` belongs to portal config by default.

Do not hardcode role-specific API paths inside feature modules.

Use `$http` and let the Axios interceptor resolve the correct base URL.

Do not create separate routes for student and parent if they share the same portal page.

Use `/users/home` instead of `/student/home` and `/parent/home`.

Do not depend only on frontend guards for security.

The backend must also return `403 Forbidden` when a role tries to access another role's endpoint.

---

## 20. Current Expected Behavior

### Student login

```txt
/users/login
→ /api/users/v1/auth
→ role = student
→ redirect /users/home
→ API base /api/users/student
```

### Parent login

```txt
/users/login
→ /api/users/v1/auth
→ role = parent
→ redirect /users/home
→ API base /api/users/parent
```

### Teacher login

```txt
/teachers/login
→ /api/teachers/v1/auth
→ role = teacher
→ redirect /teachers/home
→ API base /api/teachers/teacher
```

### Admin login

```txt
/teachers/login
→ /api/teachers/v1/auth
→ role = admin
→ redirect /teachers/home
→ API base /api/teachers/admin
```

### Assistant login

```txt
/teachers/login
→ /api/teachers/v1/auth
→ role = assistant
→ redirect /teachers/home
→ API base /api/teachers/assistant
```

---

## 21. Final Mental Model

```txt
Portal config:
Where do users log in?
What route group does this portal use?
What roles can come from this portal?
What is the default home page?

Role config:
Which portal does this role belong to?
Which API base path should this role use?

Auth store:
Who is currently logged in?

Axios:
Attach token.
Resolve API base path from role.

Guards:
Protect routes from wrong roles.

Pages:
Shared by portal.
Render role-specific sections/views only when needed.
```

The project should always follow this rule:

```txt
Portal controls login and route group.
Role controls API base path and access.
UI can be shared by portal and customized by role when needed.
```

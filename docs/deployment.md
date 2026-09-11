# Production deployment

This repository supports one production topology: the repository is the web
root and Vite emits deployable files under `/dist/`.

## Build

Use the pinned Yarn Classic release and the authoritative `yarn.lock`:

```sh
yarn install --frozen-lockfile
yarn test
yarn typecheck
yarn lint:strict
yarn format:check
yarn build
```

Vite uses `/` while developing and `/dist/` for production builds. Do not edit
`vite.config.ts` manually during deployment.

The build must contain both HTML entries:

```text
dist/index.html
dist/zoom-client-view.html
```

Both documents reference content-hashed assets below `/dist/assets/`.

## Apache behavior

The tracked `.htaccess`:

1. serves every real file below `/dist/` before applying an SPA rewrite;
2. rewrites unknown application routes to `/dist/index.html`;
3. makes HTML revalidate instead of remaining stale;
4. caches content-hashed assets immutably.

The existing-file rule is a release requirement. In particular,
`/dist/zoom-client-view.html` must never be rewritten to `index.html`.

Enable Apache `mod_rewrite`, `mod_mime`, and `mod_headers`. Serve production
over HTTPS for camera, microphone, WebRTC, screen-sharing, and mixed-content
protection.

## Smoke checks

After every deployment, verify:

```text
GET /dist/index.html
GET /dist/zoom-client-view.html
GET /dist/assets/<current hashed files>
GET /teacher/session
```

The Zoom HTML response must contain:

```html
<meta name="zoom-client-view-entry" content="v1" />
```

An unknown LMS route may return the SPA document. The Zoom HTML URL may not.

Serving `dist` as the document root or mounting the app below another public
path is not part of the current contract. Either topology requires a
coordinated, separately tested change to Vite base paths, router paths, iframe
URL generation, and hosting fallback rules.

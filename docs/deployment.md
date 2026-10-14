# Production deployment

The Rafal Dashboard is a single Vite SPA. The repository is the web root and Vite emits deployable files under `/dist/`.

## Build

Use the pinned Yarn Classic release and authoritative `yarn.lock`:

```sh
yarn install --frozen-lockfile
yarn test
yarn typecheck
yarn lint:strict
yarn format:check
yarn build
```

Vite uses the default `/` URL base in development and production. `dist/` is the build output directory, not the production URL base. The production artifact has one HTML entry, `dist/index.html`, with content-hashed assets under `dist/assets/`.

## Apache behavior

The tracked `.htaccess` serves real files below `/dist/`, rewrites unknown application routes to `/dist/index.html`, revalidates HTML, and caches content-hashed assets immutably.

After deployment, verify `GET /dist/index.html`, a current hashed asset, `/login`, and `/dashboard`.

## Vercel behavior

Use the Vite framework preset with `yarn build` and output directory `dist`.
`vercel.json` revalidates HTML, caches hashed JS/CSS immutably, and excludes
assets, API paths, and file-like requests from the SPA fallback. Verify actual
preview response headers and missing-asset 404s before production rollout.

See [dynamic import recovery](frontend/DYNAMIC_IMPORT_RECOVERY.md) for the incident
analysis, runtime recovery decisions, limitations, and two-deployment checklist.
The Apache instructions above describe a separate hosting configuration.

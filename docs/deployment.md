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

Vite uses `/` while developing and `/dist/` for production builds. The production artifact has one HTML entry, `dist/index.html`, with content-hashed assets under `dist/assets/`.

## Apache behavior

The tracked `.htaccess` serves real files below `/dist/`, rewrites unknown application routes to `/dist/index.html`, revalidates HTML, and caches content-hashed assets immutably.

After deployment, verify `GET /dist/index.html`, a current hashed asset, `/login`, and `/dashboard`.

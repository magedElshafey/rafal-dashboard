/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AFFILIATE_MOCK_API_BASE_URL?: string
  readonly VITE_AFFILIATE_MOCK_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

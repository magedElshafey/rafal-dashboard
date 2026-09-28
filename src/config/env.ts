import { resolveMapStyleUrl } from './map'

const env = {
  API_BASE: import.meta.env.VITE_API_BASE_URL,
  // Temporary feature transport until the Laravel Warehouses API is available locally.
  WAREHOUSES_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_WAREHOUSES_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Products API is available locally.
  PRODUCTS_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_PRODUCTS_USE_MOCK !== 'false',

  // Public, browser-safe MapLibre style JSON URL. Development defaults to OpenFreeMap Liberty.
  MAP_STYLE_URL: resolveMapStyleUrl(import.meta.env.VITE_MAP_STYLE_URL, import.meta.env.DEV),

  DEFAULT_LOCALE: import.meta.env.VITE_REACT_APP_DEFAULT_LOCALE || 'ar',

  THEME_KEY: import.meta.env.VITE_REACT_APP_THEME_KEY || 'theme',
  LOCALE_KEY: import.meta.env.VITE_REACT_APP_LOCALE_STORAGE_KEY || 'locale',
}

export default env

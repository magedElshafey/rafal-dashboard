import { resolveMapStyleUrl } from './map'

const env = {
  API_BASE: import.meta.env.VITE_API_BASE_URL,

  // Temporary until the Laravel authentication contract is available.
  // `import.meta.env.DEV` prevents this escape hatch from enabling in production builds.
  AUTH_BYPASS: import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true',

  // Temporary feature transport until the Laravel Roles API is available locally.
  ROLES_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_ROLES_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Admins API is available locally.
  ADMINS_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_ADMINS_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Banners API is available locally.
  BANNERS_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_BANNERS_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Categories API is available locally.
  CATEGORIES_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_CATEGORIES_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Warehouses API is available locally.
  WAREHOUSES_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_WAREHOUSES_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Regions API is available locally.
  REGIONS_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_REGIONS_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Cities API is available locally.
  CITIES_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_CITIES_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Settings API is available locally.
  SETTINGS_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_SETTINGS_USE_MOCK !== 'false',

  // Public, browser-safe MapLibre style JSON URL. Development defaults to OpenFreeMap Liberty.
  MAP_STYLE_URL: resolveMapStyleUrl(import.meta.env.VITE_MAP_STYLE_URL, import.meta.env.DEV),

  DEFAULT_LOCALE: import.meta.env.VITE_REACT_APP_DEFAULT_LOCALE || 'ar',

  THEME_KEY: import.meta.env.VITE_REACT_APP_THEME_KEY || 'theme',
  LOCALE_KEY: import.meta.env.VITE_REACT_APP_LOCALE_STORAGE_KEY || 'locale',
}

export default env

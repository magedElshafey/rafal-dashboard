import { resolveMapStyleUrl } from './map'

function isEnabled(value: string | undefined): boolean {
  return value === 'true'
}

const env = {
  API_BASE: import.meta.env.VITE_API_BASE_URL,

  // Temporary authentication bypass for development/demo environments.
  // Must be disabled for the real production release.
  AUTH_BYPASS: isEnabled(import.meta.env.VITE_AUTH_BYPASS),

  // Temporary mock transports.
  // Each feature can be switched independently between mock data and the real API.
  ROLES_USE_MOCK: isEnabled(import.meta.env.VITE_ROLES_USE_MOCK),

  ADMINS_USE_MOCK: isEnabled(import.meta.env.VITE_ADMINS_USE_MOCK),

  BANNERS_USE_MOCK: isEnabled(import.meta.env.VITE_BANNERS_USE_MOCK),

  CATEGORIES_USE_MOCK: isEnabled(import.meta.env.VITE_CATEGORIES_USE_MOCK),

  WAREHOUSES_USE_MOCK: isEnabled(import.meta.env.VITE_WAREHOUSES_USE_MOCK),

  REGIONS_USE_MOCK: isEnabled(import.meta.env.VITE_REGIONS_USE_MOCK),

  CITIES_USE_MOCK: isEnabled(import.meta.env.VITE_CITIES_USE_MOCK),

  SETTINGS_USE_MOCK: isEnabled(import.meta.env.VITE_SETTINGS_USE_MOCK),

  SHIPPING_METHODS_USE_MOCK: isEnabled(import.meta.env.VITE_SHIPPING_METHODS_USE_MOCK),

  PRODUCTS_USE_MOCK: isEnabled(import.meta.env.VITE_PRODUCTS_USE_MOCK),

  // Public, browser-safe MapLibre style JSON URL.
  MAP_STYLE_URL: resolveMapStyleUrl(import.meta.env.VITE_MAP_STYLE_URL, import.meta.env.DEV),

  DEFAULT_LOCALE: import.meta.env.VITE_REACT_APP_DEFAULT_LOCALE || 'ar',

  THEME_KEY: import.meta.env.VITE_REACT_APP_THEME_KEY || 'theme',

  LOCALE_KEY: import.meta.env.VITE_REACT_APP_LOCALE_STORAGE_KEY || 'locale',
}

export default env

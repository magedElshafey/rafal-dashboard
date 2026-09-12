const env = {
  API_BASE: import.meta.env.VITE_API_BASE_URL,

  // Temporary until the Laravel authentication contract is available.
  // `import.meta.env.DEV` prevents this escape hatch from enabling in production builds.
  AUTH_BYPASS: import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true',

  // Temporary feature transport until the Laravel Roles API is available locally.
  ROLES_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_ROLES_USE_MOCK !== 'false',

  // Temporary feature transport until the Laravel Admins API is available locally.
  ADMINS_USE_MOCK: import.meta.env.DEV && import.meta.env.VITE_ADMINS_USE_MOCK !== 'false',

  DEFAULT_LOCALE: import.meta.env.VITE_REACT_APP_DEFAULT_LOCALE || 'ar',

  THEME_KEY: import.meta.env.VITE_REACT_APP_THEME_KEY || 'theme',
  LOCALE_KEY: import.meta.env.VITE_REACT_APP_LOCALE_STORAGE_KEY || 'locale',
}

export default env

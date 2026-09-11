const env = {
  API_BASE: import.meta.env.VITE_API_BASE_URL,

  // Temporary until the Laravel authentication contract is available.
  // `import.meta.env.DEV` prevents this escape hatch from enabling in production builds.
  AUTH_BYPASS: import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true',

  DEFAULT_LOCALE: import.meta.env.VITE_REACT_APP_DEFAULT_LOCALE,

  THEME_KEY: import.meta.env.VITE_REACT_APP_THEME_KEY,
  LOCALE_KEY: import.meta.env.VITE_REACT_APP_LOCALE_STORAGE_KEY,
}

export default env

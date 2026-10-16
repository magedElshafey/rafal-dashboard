import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getI18n } from 'react-i18next'

import env from '@/config/env'
import { observer } from '@/utils/observer'
import { useAuth } from '@/store/auth'

export function applyCommonHeaders(config: InternalAxiosRequestConfig) {
  const language = getI18n().language || env.DEFAULT_LOCALE || 'en'
  const { token } = useAuth.getState()
  config.headers['Default-Language'] = language
  config.headers['Accept-Language'] = language
  config.headers.Accept = 'application/json'
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

export function notifySuccessResponse(response: AxiosResponse) {
  if (response.config.suppressSuccessNotification) {
    return response
  }

  if (typeof response.data?.data === 'string') {
    observer.fire('notify', {
      type: 'success',
      message: getI18n().t('apiFeedback.success'),
    })
  }

  return response
}
export function notifyErrorResponse(error: AxiosError) {
  if (error.config?.suppressErrorNotification) {
    return
  }

  const status = error.response?.status
  const key = !error.response
    ? 'apiFeedback.networkError'
    : status === 403
      ? 'apiFeedback.forbidden'
      : status === 409
        ? 'apiFeedback.conflict'
        : status === 422
          ? 'apiFeedback.validationError'
          : 'apiFeedback.error'

  observer.fire('notify', {
    type: 'error',
    message: getI18n().t(key),
  })
}

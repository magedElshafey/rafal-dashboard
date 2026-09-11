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
      message: response.data.data,
    })
  }

  return response
}
export function notifyErrorResponse(error: AxiosError) {
  if (error.config?.suppressErrorNotification) {
    return
  }

  const data = error.response?.data as {
    data?: unknown
    errors?: unknown
    code?: number
    message?: string
  }

  if (typeof data?.data === 'string') {
    observer.fire('notify', {
      type: 'error',
      message: data.data,
    })

    return
  }

  if (data?.message) {
    observer.fire('notify', {
      type: 'error',
      message: data.message,
    })
  }
}

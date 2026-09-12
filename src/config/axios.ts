import axios, { AxiosError, AxiosInstance } from 'axios'

import { applyCommonHeaders, notifyErrorResponse, notifySuccessResponse } from '@/config/axios.helpers'
import { clearQueryClientAtAuthBoundary } from '@/lib/react-query/query-client'
import { useAuth } from '@/store/auth'

import env from './env'

const axiosInstance: AxiosInstance = axios.create({ baseURL: env.API_BASE })

axiosInstance.interceptors.request.use((config) => {
  applyCommonHeaders(config)
  return config
})

axiosInstance.interceptors.response.use(notifySuccessResponse, (error: AxiosError) => {
  /*
   * The user intentionally cancelled the request.
   * Do not show the global API error notification.
   */
  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
    return Promise.reject(error)
  }

  const status = error.response?.status

  if (status === 401) {
    const requestAuthorization = error.config?.headers.get('Authorization')
    const { isAuthenticated, logout, token } = useAuth.getState()

    if (!isAuthenticated || !token || requestAuthorization !== `Bearer ${token}`) {
      return Promise.reject(error)
    }

    clearQueryClientAtAuthBoundary()
    logout()

    window.location.href = '/login'

    return Promise.reject(error)
  }

  if (status === 403 && !error.config?.suppressForbiddenRedirect) {
    window.location.href = '/403'

    return Promise.reject(error)
  }

  notifyErrorResponse(error)

  return Promise.reject(error)
})

export default axiosInstance

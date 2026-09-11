import axios, { AxiosError, AxiosInstance } from 'axios'

import env from './env'
import { applyCommonHeaders, notifyErrorResponse, notifySuccessResponse } from './axios.helpers'

const authAxiosInstance: AxiosInstance = axios.create({
  baseURL: env.API_BASE,
})

authAxiosInstance.interceptors.request.use(applyCommonHeaders)

authAxiosInstance.interceptors.response.use(notifySuccessResponse, (error: AxiosError) => {
  notifyErrorResponse(error)

  return Promise.reject(error)
})

export default authAxiosInstance

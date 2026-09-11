import axiosInstance from '@/config/axios'
import { createHttpClient } from '@/utils/create-http-client'

export const $http = createHttpClient(axiosInstance)

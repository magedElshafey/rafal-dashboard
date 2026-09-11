import authAxiosInstance from '@/config/auth-axios'
import { createHttpClient } from '@/utils/create-http-client'

export const $authHttp = createHttpClient(authAxiosInstance)

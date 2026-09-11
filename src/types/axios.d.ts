import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    suppressErrorNotification?: boolean
    suppressSuccessNotification?: boolean
  }

  export interface InternalAxiosRequestConfig {
    suppressErrorNotification?: boolean
    suppressSuccessNotification?: boolean
  }
}

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { cleanQueryParams, type QueryParams } from '@/utils/query-params'

type TRequest = {
  url: string
  signal?: AbortSignal
  suppressErrorNotification?: boolean
  suppressSuccessNotification?: boolean
}

type TGet = TRequest & {
  query?: QueryParams
  responseType?: AxiosRequestConfig['responseType']
}

type TDelete = TRequest & {
  query?: QueryParams
  data?: TBody
}

type TBody = object | FormData

type TPost = TRequest & {
  data?: TBody
  isFormData?: boolean
  onUploadProgress?: AxiosRequestConfig['onUploadProgress']
}

export interface IHttp {
  get<T = unknown>(arg: TGet): Promise<AxiosResponse<T>>
  delete<T = unknown>(arg: TDelete): Promise<AxiosResponse<T>>
  post<T = unknown>(arg: TPost): Promise<AxiosResponse<T>>
  put<T = unknown>(arg: TPost): Promise<AxiosResponse<T>>
  patch<T = unknown>(arg: TPost): Promise<AxiosResponse<T>>
}

export function createHttpClient(instance: AxiosInstance): IHttp {
  return {
    get<T = unknown>({
      url,
      query,
      responseType,
      signal,
      suppressErrorNotification,
      suppressSuccessNotification,
    }: TGet) {
      return instance<T>({
        url,
        params: cleanQueryParams(query),
        method: 'get',
        responseType,
        signal,
        suppressErrorNotification,
        suppressSuccessNotification,
      })
    },

    post<T = unknown>({
      url,
      data,
      isFormData,
      onUploadProgress,
      signal,
      suppressErrorNotification,
      suppressSuccessNotification,
    }: TPost) {
      return instance<T>({
        url,
        data,
        method: 'post',
        onUploadProgress,
        signal,
        suppressErrorNotification,
        suppressSuccessNotification,
        headers: isFormData
          ? undefined
          : {
              'Content-Type': 'application/json',
            },
      })
    },

    put<T = unknown>({
      url,
      data,
      isFormData,
      onUploadProgress,
      signal,
      suppressErrorNotification,
      suppressSuccessNotification,
    }: TPost) {
      return instance<T>({
        url,
        data,
        method: 'put',
        onUploadProgress,
        signal,
        suppressErrorNotification,
        suppressSuccessNotification,
        headers: isFormData
          ? undefined
          : {
              'Content-Type': 'application/json',
            },
      })
    },

    patch<T = unknown>({
      url,
      data,
      isFormData,
      onUploadProgress,
      signal,
      suppressErrorNotification,
      suppressSuccessNotification,
    }: TPost) {
      return instance<T>({
        url,
        data,
        method: 'patch',
        onUploadProgress,
        signal,
        suppressErrorNotification,
        suppressSuccessNotification,
        headers: isFormData
          ? undefined
          : {
              'Content-Type': 'application/json',
            },
      })
    },

    delete<T = unknown>({ url, query, data, signal }: TDelete) {
      return instance<T>({
        url,
        params: cleanQueryParams(query),
        data,
        method: 'delete',
        signal,
      })
    },
  }
}

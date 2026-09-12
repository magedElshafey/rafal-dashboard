import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { cleanQueryParams, type QueryParams } from '@/utils/query-params'

type TRequest = {
  url: string
  signal?: AbortSignal
  suppressErrorNotification?: boolean
  suppressSuccessNotification?: boolean
  suppressForbiddenRedirect?: boolean
}

type TGet = TRequest & {
  query?: QueryParams
  responseType?: AxiosRequestConfig['responseType']
}

type TDelete = TRequest & {
  query?: QueryParams
  data?: TBody
}

type TBody = object | FormData | URLSearchParams

type TPost = TRequest & {
  data?: TBody
  isFormData?: boolean
  isFormUrlEncoded?: boolean
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
      suppressForbiddenRedirect,
    }: TGet) {
      return instance<T>({
        url,
        params: cleanQueryParams(query),
        method: 'get',
        responseType,
        signal,
        suppressErrorNotification,
        suppressSuccessNotification,
        suppressForbiddenRedirect,
      })
    },

    post<T = unknown>({
      url,
      data,
      isFormData,
      isFormUrlEncoded,
      onUploadProgress,
      signal,
      suppressErrorNotification,
      suppressSuccessNotification,
      suppressForbiddenRedirect,
    }: TPost) {
      return instance<T>({
        url,
        data,
        method: 'post',
        onUploadProgress,
        signal,
        suppressErrorNotification,
        suppressSuccessNotification,
        suppressForbiddenRedirect,
        headers: isFormData
          ? undefined
          : {
              'Content-Type': isFormUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
            },
      })
    },

    put<T = unknown>({
      url,
      data,
      isFormData,
      isFormUrlEncoded,
      onUploadProgress,
      signal,
      suppressErrorNotification,
      suppressSuccessNotification,
      suppressForbiddenRedirect,
    }: TPost) {
      return instance<T>({
        url,
        data,
        method: 'put',
        onUploadProgress,
        signal,
        suppressErrorNotification,
        suppressSuccessNotification,
        suppressForbiddenRedirect,
        headers: isFormData
          ? undefined
          : {
              'Content-Type': isFormUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
            },
      })
    },

    patch<T = unknown>({
      url,
      data,
      isFormData,
      isFormUrlEncoded,
      onUploadProgress,
      signal,
      suppressErrorNotification,
      suppressSuccessNotification,
      suppressForbiddenRedirect,
    }: TPost) {
      return instance<T>({
        url,
        data,
        method: 'patch',
        onUploadProgress,
        signal,
        suppressErrorNotification,
        suppressSuccessNotification,
        suppressForbiddenRedirect,
        headers: isFormData
          ? undefined
          : {
              'Content-Type': isFormUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
            },
      })
    },

    delete<T = unknown>({ url, query, data, signal, suppressErrorNotification, suppressForbiddenRedirect }: TDelete) {
      return instance<T>({
        url,
        params: cleanQueryParams(query),
        data,
        method: 'delete',
        signal,
        suppressErrorNotification,
        suppressForbiddenRedirect,
      })
    },
  }
}

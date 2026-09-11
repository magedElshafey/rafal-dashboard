import { $authHttp } from '@/utils/auth-http'

export type DeviceTokenPayload = {
  firebase_token: string
  device_id: string
}

export async function registerDeviceToken(payload: DeviceTokenPayload, signal?: AbortSignal): Promise<void> {
  await $authHttp.post<{ data: string }>({
    url: '/v1/device-token',
    data: payload,
    signal,
    suppressErrorNotification: true,
    suppressSuccessNotification: true,
  })
}

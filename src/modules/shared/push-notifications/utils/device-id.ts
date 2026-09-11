export const DEVICE_ID_STORAGE_KEY = 'smart_hub_device_id'

function createUuidFromRandomValues(cryptoApi: Crypto): string {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-')
}

function createDeviceId(cryptoApi: Crypto): string {
  return typeof cryptoApi.randomUUID === 'function' ? cryptoApi.randomUUID() : createUuidFromRandomValues(cryptoApi)
}

export function getOrCreateDeviceId(storage: Storage = window.localStorage, cryptoApi: Crypto = window.crypto): string {
  const existingDeviceId = storage.getItem(DEVICE_ID_STORAGE_KEY)?.trim()

  if (existingDeviceId && existingDeviceId.length <= 255) return existingDeviceId

  const deviceId = createDeviceId(cryptoApi)
  storage.setItem(DEVICE_ID_STORAGE_KEY, deviceId)

  return deviceId
}

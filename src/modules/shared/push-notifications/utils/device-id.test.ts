import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEVICE_ID_STORAGE_KEY, getOrCreateDeviceId } from './device-id'

const generatedDeviceId = '123e4567-e89b-42d3-a456-426614174000'

function createCryptoApi() {
  return {
    randomUUID: vi.fn(() => generatedDeviceId),
    getRandomValues: vi.fn(),
  } as unknown as Crypto
}

describe('getOrCreateDeviceId', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('generates, persists, and reuses one browser installation id', () => {
    const cryptoApi = createCryptoApi()

    expect(getOrCreateDeviceId(localStorage, cryptoApi)).toBe(generatedDeviceId)
    expect(getOrCreateDeviceId(localStorage, cryptoApi)).toBe(generatedDeviceId)
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(generatedDeviceId)
    expect(cryptoApi.randomUUID).toHaveBeenCalledTimes(1)
  })

  it('reuses an existing valid id without generating another one', () => {
    const cryptoApi = createCryptoApi()
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, 'existing-browser-id')

    expect(getOrCreateDeviceId(localStorage, cryptoApi)).toBe('existing-browser-id')
    expect(cryptoApi.randomUUID).not.toHaveBeenCalled()
  })

  it('replaces an invalid overlong id with a UUID', () => {
    const cryptoApi = createCryptoApi()
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, 'x'.repeat(256))

    expect(getOrCreateDeviceId(localStorage, cryptoApi)).toBe(generatedDeviceId)
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(generatedDeviceId)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock('@/utils/http', () => ({
  $http: {
    post: mocks.post,
  },
}))

import { registerDeviceToken } from './device-token.service'

describe('registerDeviceToken', () => {
  beforeEach(() => {
    mocks.post.mockReset().mockResolvedValue({ data: { data: 'Device token saved successfully.' } })
  })

  it('posts the exact backend payload and suppresses global response UI for this request', async () => {
    const controller = new AbortController()
    const payload = {
      firebase_token: 'firebase-token',
      device_id: 'browser-device-id',
    }

    await registerDeviceToken(payload, controller.signal)

    expect(mocks.post).toHaveBeenCalledWith({
      url: '/device-token',
      data: payload,
      signal: controller.signal,
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const mocks = vi.hoisted(() => ({
  fire: vi.fn(),
}))

vi.mock('@/utils/observer', () => ({
  observer: { fire: mocks.fire },
}))

import { notifyErrorResponse, notifySuccessResponse } from './axios.helpers'

function createResponse(suppressSuccessNotification = false): AxiosResponse {
  return {
    data: { data: 'Device token saved successfully.' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: {} as AxiosResponse['config']['headers'],
      suppressSuccessNotification,
    },
  }
}

beforeEach(() => {
  mocks.fire.mockReset()
})

describe('notifySuccessResponse', () => {
  it('does not surface a success message for an explicitly silent request', () => {
    const response = createResponse(true)

    expect(notifySuccessResponse(response)).toBe(response)
    expect(mocks.fire).not.toHaveBeenCalled()
  })

  it('preserves existing success notifications for other requests', () => {
    notifySuccessResponse(createResponse())

    expect(mocks.fire).toHaveBeenCalledWith('notify', {
      type: 'success',
      message: 'Device token saved successfully.',
    })
  })
})

describe('notifyErrorResponse', () => {
  it('does not surface a backend error for an explicitly silent request', () => {
    notifyErrorResponse({
      config: {
        headers: {},
        suppressErrorNotification: true,
      } as InternalAxiosRequestConfig,
      response: { data: { message: 'Raw backend error' } },
    } as AxiosError)

    expect(mocks.fire).not.toHaveBeenCalled()
  })
})

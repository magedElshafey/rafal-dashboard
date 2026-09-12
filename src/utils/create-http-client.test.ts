import { describe, expect, it, vi } from 'vitest'

import { createHttpClient } from '@/utils/create-http-client'

describe('createHttpClient transport options', () => {
  it('sends URLSearchParams with the documented form-urlencoded content type', () => {
    const instance = vi.fn()
    const client = createHttpClient(instance as never)
    const data = new URLSearchParams({ name: 'Auditor' })

    void client.post({ url: '/roles', data, isFormUrlEncoded: true })

    expect(instance).toHaveBeenCalledWith(
      expect.objectContaining({
        data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'post',
      })
    )
  })

  it('forwards feature-owned forbidden and notification handling options for deletes', () => {
    const instance = vi.fn()
    const client = createHttpClient(instance as never)

    void client.delete({
      url: '/roles/1',
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })

    expect(instance).toHaveBeenCalledWith(
      expect.objectContaining({ suppressErrorNotification: true, suppressForbiddenRedirect: true })
    )
  })
})

import { describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { createHttpClient } from '@/utils/create-http-client'

describe('createHttpClient transport options', () => {
  it.each(['https://synthetic.test/api/v1', 'https://synthetic.test/api/v1/'])(
    'composes the Dashboard prefix once for %s and passes cancellation',
    async (baseURL) => {
      const instance = axios.create({ baseURL })
      const signal = new AbortController().signal
      instance.defaults.adapter = async (config) => {
        expect(instance.getUri(config)).toBe('https://synthetic.test/api/v1/dashboard/affiliate-settings')
        expect(config.signal).toBe(signal)
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      }
      await createHttpClient(instance).get({ url: '/dashboard/affiliate-settings', signal })
    }
  )
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

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { $authHttp } from '@/utils/auth-http'

import { getNotificationChannelsDdl, NOTIFICATION_CHANNELS_DDL_ENDPOINT } from './notification-channels.ddl.service'

vi.mock('@/utils/auth-http', () => ({ $authHttp: { get: vi.fn() } }))

describe('notification channels DDL service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests notification channels for the requested module', async () => {
    const channels = [
      { value: 'in_app', label: 'التطبيق' },
      { value: 'email', label: 'البريد الإلكتروني' },
      { value: 'whatsapp', label: 'واتساب' },
    ]
    vi.mocked($authHttp.get).mockResolvedValue({ data: { data: channels } } as never)

    await expect(getNotificationChannelsDdl('reminders')).resolves.toEqual(channels)
    expect($authHttp.get).toHaveBeenCalledWith({
      url: NOTIFICATION_CHANNELS_DDL_ENDPOINT,
      query: { module: 'reminders' },
    })
  })
})

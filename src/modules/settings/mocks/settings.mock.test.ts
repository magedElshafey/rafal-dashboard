import { beforeEach, describe, expect, it } from 'vitest'

import { resetSettingsMock, settingsMockTransport } from './settings.mock'

describe('settingsMockTransport', () => {
  beforeEach(resetSettingsMock)

  it('preserves omitted settings during a partial update', async () => {
    const response = await settingsMockTransport.update({ max_cart_item_quantity: 12 })
    expect(response.data.vat_rate).toBe(15)
    expect(response.data.max_cart_item_quantity).toBe(12)
  })
})

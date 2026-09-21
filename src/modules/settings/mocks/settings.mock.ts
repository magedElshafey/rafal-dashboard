import type {
  RawSettings,
  RawSettingsResponse,
  RawSettingsUpdatePayload,
} from '@/modules/settings/types/settings.types'

const INITIAL_SETTINGS: RawSettings = {
  vat_rate: 15,
  free_shipping_enabled: true,
  free_shipping_threshold: 500,
  gift_wrap_enabled: true,
  gift_wrap_fee: 15,
  max_addresses_per_user: 10,
  max_cart_item_quantity: 10,
  otp_resend_cooldown_seconds: 1,
}

let settings: RawSettings = { ...INITIAL_SETTINGS }
const LATENCY = 180

function wait() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY))
}

function response(message: string): RawSettingsResponse {
  return { success: true, message, data: { ...settings } }
}

export function resetSettingsMock() {
  settings = { ...INITIAL_SETTINGS }
}

export const settingsMockTransport = {
  async get(): Promise<RawSettingsResponse> {
    await wait()
    return response('Settings retrieved successfully')
  },
  async update(payload: RawSettingsUpdatePayload): Promise<RawSettingsResponse> {
    await wait()
    settings = { ...settings, ...payload }
    return response('Settings updated successfully')
  },
}

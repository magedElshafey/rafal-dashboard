import type {
  RawSettings,
  RawSettingsResponse,
  RawSettingsUpdatePayload,
  Settings,
  SettingsResponse,
  SettingsUpdatePayload,
} from '@/modules/settings/types/settings.types'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import { $http } from '@/utils/http'

function normalizeApiBoolean(value: RawSettings['free_shipping_enabled']): boolean {
  if (value !== true && value !== false && value !== 1 && value !== 0) {
    throw new Error('Settings data is unavailable')
  }
  return value === true || value === 1
}

export function normalizeSettings(settings: RawSettings): Settings {
  if (!settings || typeof settings !== 'object') throw new Error('Settings data is unavailable')
  const numericValues = [
    settings.vat_rate,
    settings.gift_wrap_fee,
    settings.max_addresses_per_user,
    settings.otp_resend_cooldown_seconds,
    settings.guest_order_verification_minutes,
    settings.low_stock_threshold,
    settings.return_window_days,
  ]
  if (settings.free_shipping_threshold !== null && !Number.isFinite(settings.free_shipping_threshold)) {
    throw new Error('Settings data is unavailable')
  }
  if (numericValues.some((value) => !Number.isFinite(value))) throw new Error('Settings data is unavailable')
  return {
    vatRate: settings.vat_rate,
    freeShippingEnabled: normalizeApiBoolean(settings.free_shipping_enabled),
    freeShippingThreshold: settings.free_shipping_threshold,
    giftWrapEnabled: normalizeApiBoolean(settings.gift_wrap_enabled),
    giftWrapFee: settings.gift_wrap_fee,
    maxAddressesPerUser: settings.max_addresses_per_user,
    otpResendCooldownSeconds: settings.otp_resend_cooldown_seconds,
    guestOrderVerificationMinutes: settings.guest_order_verification_minutes,
    lowStockThreshold: settings.low_stock_threshold,
    returnWindowDays: settings.return_window_days,
  }
}

export function serializeSettingsUpdate(payload: SettingsUpdatePayload): RawSettingsUpdatePayload {
  return {
    ...(payload.vatRate !== undefined ? { vat_rate: payload.vatRate } : {}),
    ...(payload.freeShippingEnabled !== undefined
      ? { free_shipping_enabled: toApiBoolean(payload.freeShippingEnabled) }
      : {}),
    ...(payload.freeShippingThreshold !== undefined ? { free_shipping_threshold: payload.freeShippingThreshold } : {}),
    ...(payload.giftWrapEnabled !== undefined ? { gift_wrap_enabled: toApiBoolean(payload.giftWrapEnabled) } : {}),
    ...(payload.giftWrapFee !== undefined ? { gift_wrap_fee: payload.giftWrapFee } : {}),
    ...(payload.maxAddressesPerUser !== undefined ? { max_addresses_per_user: payload.maxAddressesPerUser } : {}),
    ...(payload.otpResendCooldownSeconds !== undefined
      ? { otp_resend_cooldown_seconds: payload.otpResendCooldownSeconds }
      : {}),
    ...(payload.guestOrderVerificationMinutes !== undefined
      ? { guest_order_verification_minutes: payload.guestOrderVerificationMinutes }
      : {}),
    ...(payload.lowStockThreshold !== undefined ? { low_stock_threshold: payload.lowStockThreshold } : {}),
    ...(payload.returnWindowDays !== undefined ? { return_window_days: payload.returnWindowDays } : {}),
  }
}

function normalizeResponse(response: RawSettingsResponse): SettingsResponse {
  return { ...response, data: normalizeSettings(response.data) }
}

export const settingsService = {
  async get(signal?: AbortSignal): Promise<Settings> {
    const response = await $http.get<RawSettingsResponse>({
      url: '/dashboard/settings',
      signal,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data).data
  },
  async update(payload: SettingsUpdatePayload): Promise<Settings> {
    const response = await $http.put<RawSettingsResponse>({
      url: '/dashboard/settings',
      data: serializeSettingsUpdate(payload),
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data).data
  },
}

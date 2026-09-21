import env from '@/config/env'
import { settingsMockTransport } from '@/modules/settings/mocks/settings.mock'
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
    settings.free_shipping_threshold,
    settings.gift_wrap_fee,
    settings.max_addresses_per_user,
    settings.max_cart_item_quantity,
    settings.otp_resend_cooldown_seconds,
  ]
  if (numericValues.some((value) => !Number.isFinite(value))) throw new Error('Settings data is unavailable')
  return {
    vatRate: settings.vat_rate,
    freeShippingEnabled: normalizeApiBoolean(settings.free_shipping_enabled),
    freeShippingThreshold: settings.free_shipping_threshold,
    giftWrapEnabled: normalizeApiBoolean(settings.gift_wrap_enabled),
    giftWrapFee: settings.gift_wrap_fee,
    maxAddressesPerUser: settings.max_addresses_per_user,
    maxCartItemQuantity: settings.max_cart_item_quantity,
    otpResendCooldownSeconds: settings.otp_resend_cooldown_seconds,
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
    ...(payload.maxCartItemQuantity !== undefined ? { max_cart_item_quantity: payload.maxCartItemQuantity } : {}),
    ...(payload.otpResendCooldownSeconds !== undefined
      ? { otp_resend_cooldown_seconds: payload.otpResendCooldownSeconds }
      : {}),
  }
}

function normalizeResponse(response: RawSettingsResponse): SettingsResponse {
  return { ...response, data: normalizeSettings(response.data) }
}

export const settingsHttpTransport = {
  async get(signal?: AbortSignal) {
    return (
      await $http.get<RawSettingsResponse>({
        url: '/dashboard/settings',
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async update(payload: RawSettingsUpdatePayload) {
    return (
      await $http.put<RawSettingsResponse>({
        url: '/dashboard/settings',
        data: payload,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}

const transport = env.SETTINGS_USE_MOCK ? settingsMockTransport : settingsHttpTransport

export const settingsService = {
  async get(signal?: AbortSignal): Promise<Settings> {
    return normalizeResponse(await transport.get(signal)).data
  },
  async update(payload: SettingsUpdatePayload): Promise<Settings> {
    return normalizeResponse(await transport.update(serializeSettingsUpdate(payload))).data
  },
}

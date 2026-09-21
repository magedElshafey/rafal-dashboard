export type Settings = {
  vatRate: number
  freeShippingEnabled: boolean
  freeShippingThreshold: number
  giftWrapEnabled: boolean
  giftWrapFee: number
  maxAddressesPerUser: number
  maxCartItemQuantity: number
  otpResendCooldownSeconds: number
}

export type SettingsFormValues = Settings

export type SettingsUpdatePayload = Partial<Settings>

export type ApiBoolean = boolean | 0 | 1

export type RawSettings = {
  vat_rate: number
  free_shipping_enabled: ApiBoolean
  free_shipping_threshold: number
  gift_wrap_enabled: ApiBoolean
  gift_wrap_fee: number
  max_addresses_per_user: number
  max_cart_item_quantity: number
  otp_resend_cooldown_seconds: number
}

export type RawSettingsUpdatePayload = Partial<{
  vat_rate: number
  free_shipping_enabled: 0 | 1
  free_shipping_threshold: number
  gift_wrap_enabled: 0 | 1
  gift_wrap_fee: number
  max_addresses_per_user: number
  max_cart_item_quantity: number
  otp_resend_cooldown_seconds: number
}>

export type RawSettingsResponse = {
  success: boolean
  message: string
  data: RawSettings
}

export type SettingsResponse = {
  success: boolean
  message: string
  data: Settings
}

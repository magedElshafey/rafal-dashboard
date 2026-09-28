export type Settings = {
  vatRate: number
  freeShippingEnabled: boolean
  freeShippingThreshold: number | null
  giftWrapEnabled: boolean
  giftWrapFee: number
  maxAddressesPerUser: number
  maxCartItemQuantity: number
  otpResendCooldownSeconds: number
  guestOrderVerificationMinutes: number
  lowStockThreshold: number
  returnWindowDays: number
}

export type SettingsFormValues = Omit<Settings, 'giftWrapFee'> & { giftWrapFee: number | null }

export type SettingsUpdatePayload = Partial<Omit<Settings, 'giftWrapFee'>> & { giftWrapFee?: number }

export type ApiBoolean = boolean | 0 | 1

export type RawSettings = {
  vat_rate: number
  free_shipping_enabled: ApiBoolean
  free_shipping_threshold: number | null
  gift_wrap_enabled: ApiBoolean
  gift_wrap_fee: number
  max_addresses_per_user: number
  max_cart_item_quantity: number
  otp_resend_cooldown_seconds: number
  guest_order_verification_minutes: number
  low_stock_threshold: number
  return_window_days: number
}

export type RawSettingsUpdatePayload = Partial<{
  vat_rate: number
  free_shipping_enabled: 0 | 1
  free_shipping_threshold: number | null
  gift_wrap_enabled: 0 | 1
  gift_wrap_fee: number
  max_addresses_per_user: number
  max_cart_item_quantity: number
  otp_resend_cooldown_seconds: number
  guest_order_verification_minutes: number
  low_stock_threshold: number
  return_window_days: number
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

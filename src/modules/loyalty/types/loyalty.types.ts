import type { DashboardPaginationMeta } from '@/types/dashboard-api.types'

export type LoyaltySettings = {
  versionId: number | null
  isEnabled: boolean
  amountPerPoint: string
  redeemPoints: number
  redeemAmount: string
  maxRedeemPercent: number
  minRedeemPoints: number
  validityMonths: number | null
  expiryWarningDays: number | null
  valuePerPoint: number
  effectiveReturnPercent: number
  launchDate: string | null
  savedAt: string | null
}

export type LoyaltySettingsFormValues = {
  isEnabled: boolean
  amountPerPoint: number
  redeemPoints: number
  redeemAmount: number
  maxRedeemPercent: number
  minRedeemPoints: number
  validityMonths: number | null
  expiryWarningDays: number | null
}

export type LoyaltySettingsUpdatePayload = Omit<LoyaltySettingsFormValues, 'validityMonths' | 'expiryWarningDays'> & {
  validityMonths: number
  expiryWarningDays: number
  versionId: number | null
  confirmDisable?: true
}

export type RawLoyaltySettings = {
  version_id: number | null
  is_enabled: boolean | 0 | 1
  amount_per_point: string
  redeem_points: number
  redeem_amount: string
  max_redeem_percent: number
  min_redeem_points: number
  validity_months: number | null
  expiry_warning_days: number | null
  value_per_point: number
  effective_return_percent: number
  launch_date: string | null
  saved_at: string | null
}

export type RawLoyaltySettingsResponse = {
  success: boolean
  message: string
  data: RawLoyaltySettings
}

export type RawLoyaltySettingsUpdatePayload = {
  version_id: number | null
  is_enabled: boolean
  amount_per_point: number
  redeem_points: number
  redeem_amount: number
  max_redeem_percent: number
  min_redeem_points: number
  validity_months: number
  expiry_warning_days: number
  confirm_disable?: true
}

export type LoyaltyVersionValues = Pick<
  LoyaltySettings,
  | 'isEnabled'
  | 'amountPerPoint'
  | 'redeemPoints'
  | 'redeemAmount'
  | 'maxRedeemPercent'
  | 'minRedeemPoints'
  | 'validityMonths'
  | 'expiryWarningDays'
  | 'effectiveReturnPercent'
>

export type RawLoyaltyVersionValues = {
  is_enabled: boolean | 0 | 1
  amount_per_point: string
  redeem_points: number
  redeem_amount: string
  max_redeem_percent: number
  min_redeem_points: number
  validity_months: number | null
  expiry_warning_days: number | null
  effective_return_percent: number
}

export type LoyaltySettingsVersion = {
  id: number
  savedAt: string
  admin: { id: number; name: string }
  values: LoyaltyVersionValues
  previousValues: LoyaltyVersionValues | null
}

export type RawLoyaltySettingsVersion = {
  id: number
  saved_at: string
  admin: { id: number; name: string }
  values: RawLoyaltyVersionValues
  previous_values: RawLoyaltyVersionValues | null
}

export type RawLoyaltyVersionsResponse = {
  success: boolean
  message: string
  data: RawLoyaltySettingsVersion[]
  meta: DashboardPaginationMeta
}

export type LoyaltyVersionsPage = {
  items: LoyaltySettingsVersion[]
  meta: DashboardPaginationMeta
}

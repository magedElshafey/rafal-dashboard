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

export type CustomerLoyaltySummary = {
  available: number
  pending: number
  held: number
  expiringSoon: { points: number; expiresAt: string | null } | null
  isBlocked: boolean
}

export type RawCustomerLoyaltySummary = {
  available: number
  pending: number
  held: number
  expiring_soon: { points: number; expires_at: string | null } | null
  is_blocked: boolean | 0 | 1
}

export type RawCustomerLoyaltySummaryResponse = {
  success: boolean
  message: string
  data: RawCustomerLoyaltySummary
}

export type LoyaltyLedgerFilters = {
  type: 'adjust_credit' | null
  from: string
  to: string
}

export type CustomerLoyaltyLedgerItem = {
  id: number
  createdAt: string
  type: string
  label: string
  bucket: string
  points: number
  lotExpiresAt: string | null
  actorType: string | null
  actorName: string | null
  reason: string | null
  reasonLabel: string | null
  note: string | null
  order: unknown | null
}

export type RawCustomerLoyaltyLedgerItem = {
  id: number
  created_at: string
  type: string
  label: string
  bucket: string
  points: number
  lot_expires_at: string | null
  actor_type: string | null
  actor_name: string | null
  reason: string | null
  reason_label: string | null
  note: string | null
  order: unknown | null
}

export type RawCustomerLoyaltyLedgerResponse = {
  success: boolean
  message: string
  data: RawCustomerLoyaltyLedgerItem[]
  meta: DashboardPaginationMeta
}

export type CustomerLoyaltyLedgerPage = {
  items: CustomerLoyaltyLedgerItem[]
  meta: DashboardPaginationMeta
}

export type LoyaltyAdjustmentType = 'credit' | 'debit'
export type LoyaltyAdjustmentReason = 'customer_service' | 'other'

export type LoyaltyAdjustmentFormValues = {
  type: LoyaltyAdjustmentType
  points: number | ''
  reason: LoyaltyAdjustmentReason | ''
  note: string
  notifyCustomer: boolean
}

export type LoyaltyAdjustmentPayload = Omit<LoyaltyAdjustmentFormValues, 'points' | 'reason'> & {
  points: number
  reason: LoyaltyAdjustmentReason
}

export type RawLoyaltyAdjustmentPayload = {
  type: LoyaltyAdjustmentType
  points: number
  reason: LoyaltyAdjustmentReason
  note: string
  notify_customer: boolean
}

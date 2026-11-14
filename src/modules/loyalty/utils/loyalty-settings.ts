import type {
  LoyaltySettings,
  LoyaltySettingsFormValues,
  LoyaltySettingsUpdatePayload,
} from '@/modules/loyalty/types/loyalty.types'

export const LOYALTY_PREVIEW_ORDER_AMOUNT = 500

export type LoyaltyPreview = {
  points: number
  value: number
  returnPercent: number
}

export function roundEarnedLoyaltyPoints(points: number): number {
  return Math.round(points)
}

export function toLoyaltySettingsFormValues(settings: LoyaltySettings): LoyaltySettingsFormValues {
  return {
    isEnabled: settings.isEnabled,
    amountPerPoint: Number(settings.amountPerPoint),
    redeemPoints: settings.redeemPoints,
    redeemAmount: Number(settings.redeemAmount),
    maxRedeemPercent: settings.maxRedeemPercent,
    minRedeemPoints: settings.minRedeemPoints,
    validityMonths: settings.validityMonths,
    expiryWarningDays: settings.expiryWarningDays,
  }
}

export function buildLoyaltySettingsPayload(
  settings: LoyaltySettings,
  values: LoyaltySettingsFormValues,
  confirmDisable = false
): LoyaltySettingsUpdatePayload {
  if (values.validityMonths === null || values.expiryWarningDays === null) {
    throw new Error('Loyalty expiry settings are incomplete')
  }

  return {
    versionId: settings.versionId,
    ...values,
    validityMonths: values.validityMonths,
    expiryWarningDays: values.expiryWarningDays,
    ...(confirmDisable ? { confirmDisable: true as const } : {}),
  }
}

export function calculateLoyaltyPreview(values: Partial<LoyaltySettingsFormValues>): LoyaltyPreview | null {
  const amountPerPoint = Number(values.amountPerPoint)
  const redeemPoints = Number(values.redeemPoints)
  const redeemAmount = Number(values.redeemAmount)

  if (
    !Number.isFinite(amountPerPoint) ||
    !Number.isFinite(redeemPoints) ||
    !Number.isFinite(redeemAmount) ||
    amountPerPoint <= 0 ||
    redeemPoints <= 0 ||
    redeemAmount <= 0
  ) {
    return null
  }

  const points = roundEarnedLoyaltyPoints(LOYALTY_PREVIEW_ORDER_AMOUNT / amountPerPoint)
  const valuePerPoint = redeemAmount / redeemPoints
  return {
    points,
    value: points * valuePerPoint,
    returnPercent: (valuePerPoint / amountPerPoint) * 100,
  }
}

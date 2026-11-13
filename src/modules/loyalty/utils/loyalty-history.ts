import type { LoyaltySettingsVersion, LoyaltyVersionValues } from '@/modules/loyalty/types/loyalty.types'

export const loyaltyHistoryFields = [
  'isEnabled',
  'amountPerPoint',
  'redeemPoints',
  'redeemAmount',
  'maxRedeemPercent',
  'minRedeemPoints',
  'validityMonths',
  'expiryWarningDays',
  'effectiveReturnPercent',
] as const satisfies readonly (keyof LoyaltyVersionValues)[]

export type LoyaltyHistoryField = (typeof loyaltyHistoryFields)[number]

export type LoyaltyVersionChange = {
  field: LoyaltyHistoryField
  before: LoyaltyVersionValues[LoyaltyHistoryField] | null
  after: LoyaltyVersionValues[LoyaltyHistoryField]
}

export function getLoyaltyVersionChanges(version: LoyaltySettingsVersion): LoyaltyVersionChange[] {
  if (!version.previousValues) {
    return loyaltyHistoryFields.map((field) => ({ field, before: null, after: version.values[field] }))
  }

  return loyaltyHistoryFields.flatMap((field) =>
    version.previousValues?.[field] === version.values[field]
      ? []
      : [{ field, before: version.previousValues?.[field] ?? null, after: version.values[field] }]
  )
}

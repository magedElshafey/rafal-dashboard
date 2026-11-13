import type {
  LoyaltySettings,
  LoyaltySettingsUpdatePayload,
  LoyaltySettingsVersion,
  LoyaltyVersionValues,
  LoyaltyVersionsPage,
  RawLoyaltySettings,
  RawLoyaltySettingsResponse,
  RawLoyaltySettingsUpdatePayload,
  RawLoyaltySettingsVersion,
  RawLoyaltyVersionValues,
  RawLoyaltyVersionsResponse,
} from '@/modules/loyalty/types/loyalty.types'
import { $http } from '@/utils/http'

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${field} is unavailable`)
  return value
}

function normalizeNullablePositiveInteger(value: number | null, field: string): number | null {
  return value === null ? null : requirePositiveInteger(value, field)
}

function normalizeNullableString(value: string | null, field: string): string | null {
  if (value !== null && typeof value !== 'string') throw new Error(`${field} is unavailable`)
  return value
}

function requireNonNegativeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${field} is unavailable`)
  return value
}

function requireFiniteNumber(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} is unavailable`)
  return value
}

function requireDecimalString(value: string, field: string): string {
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value.trim())) {
    throw new Error(`${field} is unavailable`)
  }
  return value.trim()
}

function normalizeBoolean(value: boolean | 0 | 1, field: string): boolean {
  if (value !== true && value !== false && value !== 0 && value !== 1) throw new Error(`${field} is unavailable`)
  return value === true || value === 1
}

function normalizeVersionValues(raw: RawLoyaltyVersionValues): LoyaltyVersionValues {
  return {
    isEnabled: normalizeBoolean(raw.is_enabled, 'Loyalty enabled state'),
    amountPerPoint: requireDecimalString(raw.amount_per_point, 'Amount per point'),
    redeemPoints: requirePositiveInteger(raw.redeem_points, 'Redeem points'),
    redeemAmount: requireDecimalString(raw.redeem_amount, 'Redeem amount'),
    maxRedeemPercent: requirePositiveInteger(raw.max_redeem_percent, 'Maximum redeem percent'),
    minRedeemPoints: requireNonNegativeInteger(raw.min_redeem_points, 'Minimum redeem points'),
    validityMonths: normalizeNullablePositiveInteger(raw.validity_months, 'Validity months'),
    expiryWarningDays: normalizeNullablePositiveInteger(raw.expiry_warning_days, 'Expiry warning days'),
    effectiveReturnPercent: requireFiniteNumber(raw.effective_return_percent, 'Effective return percent'),
  }
}

export function normalizeLoyaltySettings(raw: RawLoyaltySettings): LoyaltySettings {
  return {
    versionId: normalizeNullablePositiveInteger(raw.version_id, 'Loyalty version'),
    isEnabled: normalizeBoolean(raw.is_enabled, 'Loyalty enabled state'),
    amountPerPoint: requireDecimalString(raw.amount_per_point, 'Amount per point'),
    redeemPoints: requirePositiveInteger(raw.redeem_points, 'Redeem points'),
    redeemAmount: requireDecimalString(raw.redeem_amount, 'Redeem amount'),
    maxRedeemPercent: requirePositiveInteger(raw.max_redeem_percent, 'Maximum redeem percent'),
    minRedeemPoints: requireNonNegativeInteger(raw.min_redeem_points, 'Minimum redeem points'),
    validityMonths: normalizeNullablePositiveInteger(raw.validity_months, 'Validity months'),
    expiryWarningDays: normalizeNullablePositiveInteger(raw.expiry_warning_days, 'Expiry warning days'),
    valuePerPoint: requireFiniteNumber(raw.value_per_point, 'Point value'),
    effectiveReturnPercent: requireFiniteNumber(raw.effective_return_percent, 'Effective return percent'),
    launchDate: normalizeNullableString(raw.launch_date, 'Launch date'),
    savedAt: normalizeNullableString(raw.saved_at, 'Saved at'),
  }
}

export function normalizeLoyaltyVersion(raw: RawLoyaltySettingsVersion): LoyaltySettingsVersion {
  return {
    id: requirePositiveInteger(raw.id, 'Loyalty version'),
    savedAt: raw.saved_at,
    admin: {
      id: requirePositiveInteger(raw.admin.id, 'Administrator'),
      name: raw.admin.name,
    },
    values: normalizeVersionValues(raw.values),
    previousValues: raw.previous_values ? normalizeVersionValues(raw.previous_values) : null,
  }
}

export function serializeLoyaltySettingsUpdate(payload: LoyaltySettingsUpdatePayload): RawLoyaltySettingsUpdatePayload {
  return {
    version_id: payload.versionId,
    is_enabled: payload.isEnabled,
    amount_per_point: payload.amountPerPoint,
    redeem_points: payload.redeemPoints,
    redeem_amount: payload.redeemAmount,
    max_redeem_percent: payload.maxRedeemPercent,
    min_redeem_points: payload.minRedeemPoints,
    validity_months: payload.validityMonths,
    expiry_warning_days: payload.expiryWarningDays,
    ...(payload.confirmDisable ? { confirm_disable: true as const } : {}),
  }
}

export const loyaltyService = {
  async getSettings(signal?: AbortSignal): Promise<LoyaltySettings> {
    const response = await $http.get<RawLoyaltySettingsResponse>({
      url: '/dashboard/loyalty/settings',
      signal,
      suppressErrorNotification: true,
    })
    return normalizeLoyaltySettings(response.data.data)
  },

  async updateSettings(payload: LoyaltySettingsUpdatePayload): Promise<LoyaltySettings> {
    const response = await $http.put<RawLoyaltySettingsResponse>({
      url: '/dashboard/loyalty/settings',
      data: serializeLoyaltySettingsUpdate(payload),
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeLoyaltySettings(response.data.data)
  },

  async getVersions(perPage = 20, signal?: AbortSignal): Promise<LoyaltyVersionsPage> {
    const response = await $http.get<RawLoyaltyVersionsResponse>({
      url: '/dashboard/loyalty/settings/versions',
      query: { per_page: perPage },
      signal,
      suppressErrorNotification: true,
    })
    return {
      items: response.data.data.map(normalizeLoyaltyVersion),
      meta: response.data.meta,
    }
  },
}

import type {
  CustomerLoyaltyLedgerItem,
  CustomerLoyaltyLedgerPage,
  CustomerLoyaltySummary,
  LoyaltyLedgerFilters,
  LoyaltyAdjustmentPayload,
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
  RawCustomerLoyaltyLedgerItem,
  RawCustomerLoyaltyLedgerResponse,
  RawCustomerLoyaltySummary,
  RawCustomerLoyaltySummaryResponse,
  RawLoyaltyAdjustmentPayload,
} from '@/modules/loyalty/types/loyalty.types'
import { serializeLoyaltyLedgerFilters } from '@/modules/loyalty/utils/loyalty-ledger'
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

function requireInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${field} is unavailable`)
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

function requireString(value: string, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is unavailable`)
  return value.trim()
}

function normalizeCustomerId(value: number): number {
  return requirePositiveInteger(value, 'Customer')
}

export function normalizeCustomerLoyaltySummary(raw: RawCustomerLoyaltySummary): CustomerLoyaltySummary {
  return {
    available: requireNonNegativeInteger(raw.available, 'Available points'),
    pending: requireNonNegativeInteger(raw.pending, 'Pending points'),
    held: requireNonNegativeInteger(raw.held, 'Held points'),
    expiringSoon: raw.expiring_soon
      ? {
          points: requireNonNegativeInteger(raw.expiring_soon.points, 'Expiring points'),
          expiresAt: normalizeNullableString(raw.expiring_soon.expires_at, 'Expiry date'),
        }
      : null,
    isBlocked: normalizeBoolean(raw.is_blocked, 'Customer loyalty blocked state'),
  }
}

export function normalizeCustomerLoyaltyLedgerItem(raw: RawCustomerLoyaltyLedgerItem): CustomerLoyaltyLedgerItem {
  return {
    id: requirePositiveInteger(raw.id, 'Ledger entry'),
    createdAt: requireString(raw.created_at, 'Ledger date'),
    type: requireString(raw.type, 'Ledger type'),
    label: requireString(raw.label, 'Ledger label'),
    bucket: requireString(raw.bucket, 'Ledger bucket'),
    points: requireInteger(raw.points, 'Ledger points'),
    lotExpiresAt: normalizeNullableString(raw.lot_expires_at, 'Lot expiry'),
    actorType: normalizeNullableString(raw.actor_type, 'Actor type'),
    actorName: normalizeNullableString(raw.actor_name, 'Actor name'),
    reason: normalizeNullableString(raw.reason, 'Reason'),
    reasonLabel: normalizeNullableString(raw.reason_label, 'Reason label'),
    note: normalizeNullableString(raw.note, 'Internal note'),
    order: raw.order,
  }
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

export function serializeLoyaltyAdjustment(payload: LoyaltyAdjustmentPayload): RawLoyaltyAdjustmentPayload {
  return {
    type: payload.type,
    points: payload.points,
    reason: payload.reason,
    note: payload.note,
    notify_customer: payload.notifyCustomer,
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

  async getCustomerSummary(customerId: number, signal?: AbortSignal): Promise<CustomerLoyaltySummary> {
    const id = normalizeCustomerId(customerId)
    const response = await $http.get<RawCustomerLoyaltySummaryResponse>({
      url: `/dashboard/customers/${id}/loyalty`,
      signal,
      suppressErrorNotification: true,
    })
    return normalizeCustomerLoyaltySummary(response.data.data)
  },

  async getCustomerLedger(
    customerId: number,
    filters: LoyaltyLedgerFilters,
    signal?: AbortSignal
  ): Promise<CustomerLoyaltyLedgerPage> {
    const id = normalizeCustomerId(customerId)
    const response = await $http.get<RawCustomerLoyaltyLedgerResponse>({
      url: `/dashboard/customers/${id}/loyalty/ledger`,
      query: serializeLoyaltyLedgerFilters(filters),
      signal,
      suppressErrorNotification: true,
    })
    return {
      items: response.data.data.map(normalizeCustomerLoyaltyLedgerItem),
      meta: response.data.meta,
    }
  },

  async adjustCustomerPoints(customerId: number, payload: LoyaltyAdjustmentPayload): Promise<CustomerLoyaltySummary> {
    const id = normalizeCustomerId(customerId)
    const response = await $http.post<RawCustomerLoyaltySummaryResponse>({
      url: `/dashboard/customers/${id}/loyalty/adjustments`,
      data: serializeLoyaltyAdjustment(payload),
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeCustomerLoyaltySummary(response.data.data)
  },
}

import type {
  Coupon,
  CouponCreatePayload,
  CouponFormValues,
  CouponUpdatePayload,
  LocalizedNullableText,
} from '@/modules/coupons/types/coupon.types'
import { toCouponApiDateTime, toCouponDateTimeInput } from '@/modules/coupons/utils/coupon-datetime'
import type { LocalizedName } from '@/types/localized-name.types'

function emptyToNull(value: string): string | null {
  const normalized = value.trim()
  return normalized || null
}

export function getLocalizedCouponValue(value: LocalizedName | LocalizedNullableText, language: string) {
  const preferred = language.startsWith('ar') ? value.ar : value.en
  return preferred?.trim() || value.ar?.trim() || value.en?.trim() || '—'
}

export function toCouponFormValues(coupon: Coupon): CouponFormValues {
  return {
    code: coupon.code,
    name: { ...coupon.name },
    description: { ar: coupon.description.ar ?? '', en: coupon.description.en ?? '' },
    type: coupon.type,
    value: coupon.value,
    maxDiscountAmount: coupon.type === 'percent' ? coupon.maxDiscountAmount : null,
    minOrderAmount: coupon.minOrderAmount,
    startsAt: toCouponDateTimeInput(coupon.startsAt),
    endsAt: toCouponDateTimeInput(coupon.endsAt),
    isPublic: coupon.isPublic,
    isActive: coupon.isActive,
    usageLimitTotal: coupon.usageLimitTotal,
    usageLimitPerCustomer: coupon.usageLimitPerCustomer,
    newCustomersOnly: coupon.newCustomersOnly,
  }
}

export function buildCouponCreatePayload(values: CouponFormValues): CouponCreatePayload {
  return {
    code: values.code.trim(),
    name: { ar: values.name.ar.trim(), en: values.name.en.trim() },
    description: { ar: emptyToNull(values.description.ar), en: emptyToNull(values.description.en) },
    type: values.type,
    value: values.value,
    maxDiscountAmount: values.type === 'percent' ? values.maxDiscountAmount : null,
    minOrderAmount: values.minOrderAmount,
    startsAt: toCouponApiDateTime(values.startsAt),
    endsAt: toCouponApiDateTime(values.endsAt),
    isPublic: values.isPublic,
    isActive: values.isActive,
    usageLimitTotal: values.usageLimitTotal,
    usageLimitPerCustomer: values.usageLimitPerCustomer,
    newCustomersOnly: values.newCustomersOnly,
  }
}

export function buildCouponUpdatePayload(values: CouponFormValues): CouponUpdatePayload {
  return buildCouponCreatePayload(values)
}

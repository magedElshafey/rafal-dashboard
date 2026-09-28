import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Badge } from '@/components/ui/badge'
import { CouponActions } from '@/modules/coupons/components/CouponActions'
import type { Coupon } from '@/modules/coupons/types/coupon.types'
import { getLocalizedCouponValue } from '@/modules/coupons/utils/coupon.utils'

type Props = {
  coupons: readonly Coupon[]
  onEdit: (coupon: Coupon) => void
  onDelete: (coupon: Coupon) => void
  actionsDisabled?: boolean
}

function getScheduleKey(coupon: Coupon) {
  const now = Date.now()
  const start = coupon.startsAt ? new Date(coupon.startsAt).getTime() : null
  const end = coupon.endsAt ? new Date(coupon.endsAt).getTime() : null
  if (start !== null && start > now) return 'scheduled'
  if (end !== null && end < now) return 'expired'
  return start !== null || end !== null ? 'current' : 'anytime'
}

export function CouponsList({ coupons, onEdit, onDelete, actionsDisabled = false }: Props) {
  const { t, i18n } = useTranslation()
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar' : 'en', { maximumFractionDigits: 20 }),
    [i18n.language]
  )
  const columns = [
    { id: 'coupon', header: t('coupons.fields.coupon') },
    { id: 'discount', header: t('coupons.fields.discount'), className: 'w-32' },
    { id: 'status', header: t('coupons.fields.status'), className: 'w-40' },
    { id: 'usage', header: t('coupons.fields.usagesCount'), className: 'w-24' },
    { id: 'schedule', header: t('coupons.fields.schedule'), className: 'w-28' },
    { id: 'actions', header: t('coupons.actions.label'), className: 'w-20' },
  ]
  const discount = (coupon: Coupon) => (
    <span>
      {numberFormatter.format(coupon.value)}
      {coupon.type === 'percent' ? '%' : ''}
      <span className="ms-1 text-xs text-muted-foreground">{t(`coupons.types.${coupon.type}`)}</span>
    </span>
  )
  const status = (coupon: Coupon) => (
    <div className="flex flex-wrap gap-1">
      <Badge variant={coupon.isActive ? 'success' : 'outline'}>
        {t(coupon.isActive ? 'coupons.status.active' : 'coupons.status.inactive')}
      </Badge>
      <Badge variant={coupon.isPublic ? 'secondary' : 'outline'}>
        {t(coupon.isPublic ? 'coupons.status.public' : 'coupons.status.private')}
      </Badge>
    </div>
  )
  const schedule = (coupon: Coupon) => {
    const key = getScheduleKey(coupon)
    return <Badge variant={key === 'expired' ? 'outline' : 'secondary'}>{t(`coupons.schedule.${key}`)}</Badge>
  }

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {coupons.map((coupon) => {
            const name = getLocalizedCouponValue(coupon.name, i18n.language)
            return (
              <ResponsiveDataTableRow key={coupon.id}>
                <ResponsiveDataTableCell className="max-w-64 whitespace-normal">
                  <div className="font-medium">
                    <bdi dir="auto" className="break-words">
                      {name}
                    </bdi>
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {coupon.code}
                  </Badge>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{discount(coupon)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{status(coupon)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{numberFormatter.format(coupon.usagesCount)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{schedule(coupon)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <CouponActions
                    coupon={coupon}
                    name={name}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabled={actionsDisabled}
                  />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {coupons.map((coupon) => {
          const name = getLocalizedCouponValue(coupon.name, i18n.language)
          return (
            <ResponsiveDataMobileCard
              key={coupon.id}
              title={name}
              subtitle={coupon.code}
              actions={
                <CouponActions
                  coupon={coupon}
                  name={name}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={actionsDisabled}
                />
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('coupons.fields.discount')}>{discount(coupon)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('coupons.fields.status')}>{status(coupon)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('coupons.fields.usagesCount')}>
                    {numberFormatter.format(coupon.usagesCount)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('coupons.fields.schedule')}>{schedule(coupon)}</ResponsiveDataFact>
                </>
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}

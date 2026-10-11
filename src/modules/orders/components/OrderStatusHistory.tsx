import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { OrderDetail } from '../types/order.types'
import { humanizeOrderValue, orderStatusLabel } from '../utils/order-presentation'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderDetailsSection } from './OrderDetailsSection'

export function OrderStatusHistory({ order }: { order?: OrderDetail }) {
  const { t, i18n } = useTranslation()
  const history = order?.statusHistory ?? Array.from({ length: 3 }, () => undefined)
  return (
    <OrderDetailsSection title={t('orders.history')}>
      {history.length ? (
        <ol className="space-y-5 border-s ps-5">
          {history.map((entry, index) => (
            <li key={index} className="min-w-0 space-y-2 [overflow-wrap:anywhere]">
              <div className="flex min-h-6 flex-wrap items-center gap-2">
                {entry ? (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {entry.fromStatus
                        ? t('orders.details.fromStatus', { status: orderStatusLabel(entry.fromStatus, [], t) })
                        : t('orders.initialEvent')}
                    </span>
                    <OrderStatusBadge value={entry.toStatus} />
                  </>
                ) : (
                  <Skeleton className="h-6 w-48 max-w-full" />
                )}
              </div>
              <div className="min-h-5 text-sm">
                {entry ? (
                  <>
                    <bdi>
                      {entry.actorName?.trim() ||
                        (['system', 'admin'].includes(entry.actorType)
                          ? t(`orders.values.${entry.actorType}`)
                          : humanizeOrderValue(entry.actorType))}
                    </bdi>
                    <span aria-hidden="true"> · </span>
                    <time dateTime={entry.createdAt}>
                      {formatDateTime(entry.createdAt, { locale: resolveAppLocale(i18n.language) }) || '—'}
                    </time>
                  </>
                ) : (
                  <Skeleton className="h-5 w-64 max-w-full" />
                )}
              </div>
              <div className="min-h-5 whitespace-pre-wrap text-sm text-muted-foreground">
                {entry ? <bdi>{entry.note?.trim() || '—'}</bdi> : <Skeleton className="h-5 w-40 max-w-full" />}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{t('orders.details.noHistory')}</p>
      )}
    </OrderDetailsSection>
  )
}

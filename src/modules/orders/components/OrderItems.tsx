import { useTranslation } from 'react-i18next'
import {
  ResponsiveDataDesktop,
  ResponsiveDataTable,
  ResponsiveDataTableRow,
  ResponsiveDataTableCell,
  ResponsiveDataMobileCards,
  ResponsiveDataMobileCard,
  ResponsiveDataFact,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import type { OrderItem } from '../types/order.types'
import { orderMoneyLabel } from '../utils/order-presentation'
import { Skeleton } from '@/components/ui/skeleton'

export function VariantAttributes({ attributes }: { attributes: Record<string, string> }) {
  if (!Object.keys(attributes).length) return null
  return (
    <dl className="space-y-1">
      {Object.entries(attributes).map(([key, value]) => (
        <div key={key} className="flex flex-wrap items-center gap-2">
          <dt>
            <bdi>{key}</bdi>
          </dt>
          <dd className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]">
            {key === 'color' && /^#[0-9a-fA-F]{6}$/.test(value) && (
              <span
                aria-hidden="true"
                className="inline-block size-4 rounded border"
                style={{ backgroundColor: value }}
              />
            )}
            <bdi>{value}</bdi>
          </dd>
        </div>
      ))}
    </dl>
  )
}
function ItemDescription({
  item,
  currency,
  showName = true,
}: {
  item?: OrderItem
  currency?: string
  showName?: boolean
}) {
  const { t, i18n } = useTranslation()
  return (
    <div className="min-w-0 space-y-2 [overflow-wrap:anywhere]">
      {showName ? (
        item ? (
          <bdi className="font-medium">{item.productName}</bdi>
        ) : (
          <Skeleton className="h-5 w-36 max-w-full" />
        )
      ) : null}
      <div className="text-xs text-muted-foreground">
        {item ? (
          <>
            <span>{t('orders.sku')}: </span>
            <bdi>{item.variantSku}</bdi>
          </>
        ) : (
          <Skeleton className="h-4 w-28 max-w-full" />
        )}
      </div>
      {item ? <VariantAttributes attributes={item.variantAttributes} /> : <Skeleton className="h-4 w-20" />}
      {item?.personalization ? (
        <dl className="space-y-1">
          <div>
            <dt className="text-muted-foreground">{t('orders.personalization.text')}</dt>
            <dd>
              <bdi>{item.personalization.text}</bdi>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('orders.personalization.language')}</dt>
            <dd>
              <bdi>{item.personalization.language}</bdi>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('orders.personalization.fee')}</dt>
            <dd>
              <bdi>{currency ? orderMoneyLabel(item.personalization.fee, currency, i18n.language) : '—'}</bdi>
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  )
}

export function OrderItems({ items, currency }: { items?: OrderItem[]; currency?: string }) {
  const { t, i18n } = useTranslation()
  const fields = ['product', 'quantity', 'unitPrice', 'discount', 'lineTotal']
  const columns = fields.map((id) => ({
    id,
    header: t(`orders.${id}`),
    className: id === 'product' ? 'w-2/5' : undefined,
  }))
  const rows = items ?? Array.from({ length: 3 }, () => undefined)
  const values = (item?: OrderItem) => [
    item ? (
      new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar' : 'en').format(item.quantity)
    ) : (
      <Skeleton className="h-5 w-8" />
    ),
    ...[item?.unitPrice, item?.discountAmount, item?.lineTotal].map((value) =>
      value && currency ? (
        <bdi>{orderMoneyLabel(value, currency, i18n.language)}</bdi>
      ) : (
        <Skeleton className="h-5 w-20" />
      )
    ),
  ]
  if (!rows.length) return <p className="text-sm text-muted-foreground">{t('orders.details.noItems')}</p>
  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns} aria-label={t('orders.fields.items')}>
          {rows.map((item, row) => (
            <ResponsiveDataTableRow key={item?.id ?? row}>
              <ResponsiveDataTableCell className="max-w-64 whitespace-normal">
                <ItemDescription item={item} currency={currency} />
              </ResponsiveDataTableCell>
              {values(item).map((value, index) => (
                <ResponsiveDataTableCell
                  key={fields[index + 1]}
                  className="max-w-40 whitespace-normal [overflow-wrap:anywhere]"
                >
                  {value}
                </ResponsiveDataTableCell>
              ))}
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {rows.map((item, row) => (
          <ResponsiveDataMobileCard
            key={item?.id ?? row}
            className="[overflow-wrap:anywhere]"
            title={<bdi>{item?.productName ?? t('orders.product')}</bdi>}
            facts={values(item).map((value, index) => (
              <ResponsiveDataFact key={fields[index + 1]} label={t(`orders.${fields[index + 1]}`)}>
                {value}
              </ResponsiveDataFact>
            ))}
            footer={<ItemDescription item={item} currency={currency} showName={false} />}
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}

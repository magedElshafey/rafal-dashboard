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

export function VariantAttributes({ attributes }: { attributes: Record<string, string> }) {
  return (
    <dl className="space-y-1">
      {Object.entries(attributes).map(([key, value]) => (
        <div key={key} className="flex flex-wrap items-center gap-2">
          <dt>
            <bdi>{key}</bdi>
          </dt>
          <dd className="flex items-center gap-2">
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
export function OrderItems({ items, currency }: { items: OrderItem[]; currency: string }) {
  const { t, i18n } = useTranslation()
  const fields = ['product', 'sku', 'attributes', 'quantity', 'unitPrice', 'discount', 'lineTotal']
  const columns = fields.map((id) => ({ id, header: t(`orders.${id}`) }))
  const values = (item: OrderItem) => [
    <bdi>{item.productName}</bdi>,
    <bdi>{item.variantSku}</bdi>,
    <VariantAttributes attributes={item.variantAttributes} />,
    item.quantity,
    ...[item.unitPrice, item.discountAmount, item.lineTotal].map((value) => (
      <bdi>{orderMoneyLabel(value, currency, i18n.language)}</bdi>
    )),
  ]
  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {items.map((item) => (
            <ResponsiveDataTableRow key={item.id}>
              {values(item).map((value, index) => (
                <ResponsiveDataTableCell key={fields[index]} className="max-w-64 whitespace-normal break-words">
                  {value}
                </ResponsiveDataTableCell>
              ))}
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {items.map((item) => (
          <ResponsiveDataMobileCard
            key={item.id}
            title={<bdi>{item.productName}</bdi>}
            facts={values(item)
              .slice(1)
              .map((value, index) => (
                <ResponsiveDataFact key={fields[index + 1]} label={t(`orders.${fields[index + 1]}`)}>
                  {value}
                </ResponsiveDataFact>
              ))}
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}

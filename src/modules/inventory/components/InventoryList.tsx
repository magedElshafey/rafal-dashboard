import { useTranslation } from 'react-i18next'
import { InventoryRecordCard } from '@/modules/inventory/components/InventoryRecordCard'
import type { InventoryStock } from '@/modules/inventory/types/inventory.types'

export function InventoryList({
  items,
  loading = false,
  onStocktake,
}: {
  items: InventoryStock[]
  loading?: boolean
  onStocktake?: (stock: InventoryStock) => void
}) {
  const { t } = useTranslation()
  // Mirror the currently supplied 15-record page. This is presentation only, never a request parameter.
  const rows = loading ? Array.from({ length: 15 }, () => null) : items
  return (
    <ol aria-label={t('inventory.listTitle')} aria-hidden={loading || undefined} className="space-y-3 p-3 sm:p-4">
      {rows.map((stock, index) => (
        <li key={stock?.id ?? index}>
          <InventoryRecordCard stock={stock} onStocktake={onStocktake} />
        </li>
      ))}
    </ol>
  )
}

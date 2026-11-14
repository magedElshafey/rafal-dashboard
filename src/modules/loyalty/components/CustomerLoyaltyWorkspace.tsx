import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useCustomerLoyalty } from '@/modules/loyalty/hooks/useCustomerLoyalty'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { readLoyaltyLedgerFilters } from '@/modules/loyalty/utils/loyalty-ledger'
import { CustomerLoyaltyAdjustmentDialog } from './CustomerLoyaltyAdjustmentDialog'
import { CustomerLoyaltyFilters } from './CustomerLoyaltyFilters'
import { CustomerLoyaltyLedger } from './CustomerLoyaltyLedger'
import { CustomerLoyaltySummary } from './CustomerLoyaltySummary'

export function CustomerLoyaltyWorkspace({ customerId }: { customerId: number }) {
  const { t } = useTranslation()
  const { forwardQuery } = useQuery()
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const adjustmentTriggerRef = useRef<HTMLButtonElement>(null)
  const filters = readLoyaltyLedgerFilters(forwardQuery)
  const summaryQuery = useCustomerLoyalty(customerId, true)
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button ref={adjustmentTriggerRef} onClick={() => setAdjustmentOpen(true)}>
          {t('loyalty.customer.adjustment.action')}
        </Button>
      </div>
      <CustomerLoyaltySummary query={summaryQuery} />
      <CustomerLoyaltyFilters filters={filters} />
      <CustomerLoyaltyLedger customerId={customerId} filters={filters} />
      <CustomerLoyaltyAdjustmentDialog
        customerId={customerId}
        summary={summaryQuery.data}
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        triggerRef={adjustmentTriggerRef}
      />
    </div>
  )
}

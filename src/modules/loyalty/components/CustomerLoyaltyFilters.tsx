import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery } from '@/store/queryContext/useQueryContext'
import type { LoyaltyLedgerFilters } from '@/modules/loyalty/types/loyalty.types'
import { getLoyaltyLedgerDateState } from '@/modules/loyalty/utils/loyalty-ledger'

export function CustomerLoyaltyFilters({ filters }: { filters: LoyaltyLedgerFilters }) {
  const { t } = useTranslation()
  const { forwardAddQuery, forwardDeleteQuery } = useQuery()
  const dateState = getLoyaltyLedgerDateState(filters)
  const dateErrorId = dateState === 'valid' ? undefined : 'loyalty-ledger-date-error'
  const types = [{ value: 'adjust_credit', label: t('loyalty.customer.ledger.types.adjustCredit') }]
  const updateDate = (name: 'from' | 'to', value: string) =>
    forwardAddQuery({ [name]: value }, { resetQueryNames: ['page'] })

  return (
    <DashboardCard padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('loyalty.customer.filters.title')}</h2>
        <Button
          type="button"
          variant="ghost"
          disabled={!filters.type && !filters.from && !filters.to}
          onClick={() => forwardDeleteQuery(['type', 'from', 'to'], { resetQueryNames: ['page'] })}
        >
          {t('loyalty.customer.filters.clear')}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FilterSelect
          name="type"
          label={t('loyalty.customer.filters.type')}
          placeholder={t('loyalty.customer.filters.allTypes')}
          data={types}
          valueKey="value"
          labelKey="label"
          resetQueryNamesOnChange={['page']}
          resetQueryNamesOnClear
        />
        {(['from', 'to'] as const).map((name) => (
          <div key={name}>
            <Label className="mb-2 text-foreground" htmlFor={`loyalty-ledger-${name}`}>
              {t(`loyalty.customer.filters.${name}`)}
            </Label>
            <Input
              id={`loyalty-ledger-${name}`}
              type="date"
              value={filters[name]}
              aria-invalid={dateState !== 'valid'}
              aria-describedby={dateErrorId}
              onChange={(event) => updateDate(name, event.target.value)}
            />
          </div>
        ))}
      </div>
      {dateErrorId ? (
        <p id={dateErrorId} role="alert" className="text-sm text-destructive">
          {t(`loyalty.customer.filters.${dateState === 'incomplete' ? 'completeRange' : 'invalidRange'}`)}
        </p>
      ) : null}
    </DashboardCard>
  )
}

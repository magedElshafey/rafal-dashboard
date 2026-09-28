import { Ban, Eye, LockOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { CustomerListItem } from '@/modules/customers/types/customer.types'

type Props = {
  customer: CustomerListItem
  displayName: string
  onView: (customer: CustomerListItem) => void
  onAccessChange: (customer: CustomerListItem) => void
}

export function CustomerActions({ customer, displayName, onView, onAccessChange }: Props) {
  const { t } = useTranslation()
  const accessAction = customer.isBlocked ? 'unblock' : 'block'

  return (
    <DashboardCardActions
      triggerMode="menu"
      triggerLabel={t('customers.actions.forCustomer', { name: displayName })}
      actions={[
        {
          id: 'view',
          label: t('customers.actions.view'),
          accessibleLabel: t('customers.actions.viewNamed', { name: displayName }),
          icon: Eye,
          onClick: () => onView(customer),
        },
        {
          id: accessAction,
          label: t(`customers.actions.${accessAction}`),
          accessibleLabel: t(`customers.actions.${accessAction}Named`, { name: displayName }),
          icon: customer.isBlocked ? LockOpen : Ban,
          variant: customer.isBlocked ? 'success' : 'destructive',
          onClick: () => onAccessChange(customer),
        },
      ]}
    />
  )
}

import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { StaticPage } from '@/modules/static-pages/types/static-page.types'

type Props = {
  page: StaticPage
  title: string
  onEdit: (page: StaticPage) => void
}

export function StaticPageActions({ page, title, onEdit }: Props) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      triggerLabel={t('staticPages.actions.forPage', { title })}
      actions={[
        {
          id: 'edit',
          label: t('staticPages.actions.edit'),
          accessibleLabel: t('staticPages.actions.editNamed', { name: title }),
          icon: Pencil,
          onClick: () => onEdit(page),
        },
      ]}
    />
  )
}

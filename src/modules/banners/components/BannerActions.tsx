import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { Banner } from '@/modules/banners/types/banner.types'

type BannerActionsProps = {
  banner: Banner
  displayTitle: string
  onEdit: (banner: Banner) => void
  onDelete: (banner: Banner) => void
  disabled?: boolean
}

export function BannerActions({ banner, displayTitle, onEdit, onDelete, disabled = false }: BannerActionsProps) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('banners.actions.forBanner', { title: displayTitle })}
      actions={[
        {
          id: 'edit',
          label: t('banners.actions.edit'),
          accessibleLabel: t('banners.actions.editNamed', { title: displayTitle }),
          icon: Pencil,
          onClick: () => onEdit(banner),
        },
        {
          id: 'delete',
          label: t('banners.actions.delete'),
          accessibleLabel: t('banners.actions.deleteNamed', { title: displayTitle }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(banner),
        },
      ]}
    />
  )
}

import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { Testimonial } from '@/modules/testimonials/types/testimonial.types'

type Props = {
  testimonial: Testimonial
  displayName: string
  onEdit: (testimonial: Testimonial) => void
  onDelete: (testimonial: Testimonial) => void
  disabled?: boolean
}

export function TestimonialActions({ testimonial, displayName, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('testimonials.actions.forTestimonial', { name: displayName, id: testimonial.id })}
      actions={[
        {
          id: 'edit',
          label: t('testimonials.actions.edit'),
          accessibleLabel: t('testimonials.actions.editNamed', { name: displayName, id: testimonial.id }),
          icon: Pencil,
          onClick: () => onEdit(testimonial),
        },
        {
          id: 'delete',
          label: t('testimonials.actions.delete'),
          accessibleLabel: t('testimonials.actions.deleteNamed', { name: displayName, id: testimonial.id }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(testimonial),
        },
      ]}
    />
  )
}

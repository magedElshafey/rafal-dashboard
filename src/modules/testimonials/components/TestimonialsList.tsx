import { Star, UserRound } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TestimonialActions } from '@/modules/testimonials/components/TestimonialActions'
import type { Testimonial } from '@/modules/testimonials/types/testimonial.types'
import { getLocalizedTestimonialValue } from '@/modules/testimonials/utils/testimonial.utils'

type Props = {
  testimonials: readonly Testimonial[]
  onEdit: (testimonial: Testimonial) => void
  onDelete: (testimonial: Testimonial) => void
  actionsDisabled?: boolean
}

function TestimonialAvatar({ testimonial, name }: { testimonial: Testimonial; name: string }) {
  const { t } = useTranslation()
  return (
    <Avatar className="size-11 border border-border bg-muted">
      {testimonial.avatarUrl ? (
        <AvatarImage
          src={testimonial.avatarUrl}
          alt={t('testimonials.avatar.alt', { name })}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback aria-label={t('testimonials.avatar.fallback', { name })}>
        <UserRound className="size-5" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )
}

export function TestimonialsList({ testimonials, onEdit, onDelete, actionsDisabled = false }: Props) {
  const { t, i18n } = useTranslation()
  const numberFormatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language])
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }), [i18n.language])
  const columns = [
    { id: 'testimonial', header: t('testimonials.fields.testimonial') },
    { id: 'rating', header: t('testimonials.fields.rating'), className: 'w-24' },
    { id: 'published', header: t('testimonials.fields.status'), className: 'w-28' },
    { id: 'sort', header: t('testimonials.fields.sortOrder'), className: 'w-24' },
    { id: 'updated', header: t('testimonials.fields.updatedAt'), className: 'w-36' },
    { id: 'actions', header: t('testimonials.actions.label'), className: 'w-20' },
  ]
  const rating = (testimonial: Testimonial) => (
    <span
      className="inline-flex items-center gap-1 font-medium"
      aria-label={t('testimonials.ratingValue', { rating: testimonial.rating })}
    >
      <Star className="size-4 fill-current text-warning-500" aria-hidden="true" />
      {numberFormatter.format(testimonial.rating)}
    </span>
  )
  const published = (testimonial: Testimonial) => (
    <Badge variant={testimonial.isPublished ? 'success' : 'outline'}>
      {t(testimonial.isPublished ? 'testimonials.status.published' : 'testimonials.status.unpublished')}
    </Badge>
  )
  const updated = (testimonial: Testimonial) => dateFormatter.format(new Date(testimonial.updatedAt))

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {testimonials.map((testimonial) => {
            const name = getLocalizedTestimonialValue(testimonial.name, i18n.language)
            const title = getLocalizedTestimonialValue(testimonial.title, i18n.language)
            return (
              <ResponsiveDataTableRow key={testimonial.id}>
                <ResponsiveDataTableCell className="max-w-72 whitespace-normal">
                  <div className="flex items-center gap-3">
                    <TestimonialAvatar testimonial={testimonial} name={name} />
                    <div className="min-w-0">
                      <p className="break-words font-medium text-foreground">
                        <bdi dir="auto">{name}</bdi>
                      </p>
                      <p className="break-words text-sm text-muted-foreground">
                        <bdi dir="auto">{title}</bdi>
                      </p>
                    </div>
                  </div>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{rating(testimonial)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{published(testimonial)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{numberFormatter.format(testimonial.sortOrder)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{updated(testimonial)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <TestimonialActions
                    testimonial={testimonial}
                    displayName={name}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabled={actionsDisabled}
                  />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {testimonials.map((testimonial) => {
          const name = getLocalizedTestimonialValue(testimonial.name, i18n.language)
          const title = getLocalizedTestimonialValue(testimonial.title, i18n.language)
          return (
            <ResponsiveDataMobileCard
              key={testimonial.id}
              title={name}
              subtitle={title}
              actions={
                <TestimonialActions
                  testimonial={testimonial}
                  displayName={name}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={actionsDisabled}
                />
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('testimonials.fields.rating')}>{rating(testimonial)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('testimonials.fields.status')}>
                    {published(testimonial)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('testimonials.fields.sortOrder')}>
                    {numberFormatter.format(testimonial.sortOrder)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('testimonials.fields.updatedAt')}>
                    {updated(testimonial)}
                  </ResponsiveDataFact>
                </>
              }
              footer={
                <div className="flex items-center gap-3">
                  <TestimonialAvatar testimonial={testimonial} name={name} />
                  <p className="line-clamp-2 min-w-0 text-sm text-muted-foreground">
                    {getLocalizedTestimonialValue(testimonial.comment, i18n.language)}
                  </p>
                </div>
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}

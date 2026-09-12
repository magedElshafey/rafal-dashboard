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
import { Badge } from '@/components/ui/badge'
import { BannerActions } from '@/modules/banners/components/BannerActions'
import { BannerSchedule } from '@/modules/banners/components/BannerSchedule'
import type { Banner } from '@/modules/banners/types/banner.types'

type BannersListProps = {
  banners: readonly Banner[]
  onEdit: (banner: Banner) => void
  onDelete: (banner: Banner) => void
  actionsDisabled?: boolean
}

export function BannersList({ banners, onEdit, onDelete, actionsDisabled = false }: BannersListProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const columns = [
    { id: 'image', header: t('banners.fields.image'), className: 'w-24' },
    { id: 'title', header: t('banners.fields.title') },
    { id: 'placement', header: t('banners.fields.placement') },
    { id: 'platform', header: t('banners.fields.platform') },
    { id: 'schedule', header: t('banners.fields.schedule') },
    { id: 'sort', header: t('banners.fields.sortOrder'), className: 'w-24' },
    { id: 'actions', header: t('banners.actions.label'), className: 'w-20' },
  ]

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {banners.map((banner) => {
            const title = banner.title[language]
            return (
              <ResponsiveDataTableRow key={banner.id}>
                <ResponsiveDataTableCell>
                  <img
                    src={banner.image_url}
                    alt=""
                    className="h-12 w-20 rounded-lg bg-black-50 object-cover"
                    loading="lazy"
                  />
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="max-w-64 whitespace-normal font-medium text-content-primary">
                  <span className="break-words">{title}</span>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <Badge variant="secondary">{t(`banners.placements.${banner.placement}`)}</Badge>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <Badge variant="outline">{t(`banners.platforms.${banner.platform}`)}</Badge>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <BannerSchedule banner={banner} />
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="text-center font-medium">
                  {banner.sort_order}
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <BannerActions
                    banner={banner}
                    displayTitle={title}
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
        {banners.map((banner) => {
          const title = banner.title[language]
          return (
            <ResponsiveDataMobileCard
              key={banner.id}
              title={title}
              actions={
                <BannerActions
                  banner={banner}
                  displayTitle={title}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={actionsDisabled}
                />
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('banners.fields.placement')}>
                    <Badge variant="secondary">{t(`banners.placements.${banner.placement}`)}</Badge>
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('banners.fields.platform')}>
                    <Badge variant="outline">{t(`banners.platforms.${banner.platform}`)}</Badge>
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('banners.fields.schedule')}>
                    <BannerSchedule banner={banner} />
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('banners.fields.sortOrder')}>{banner.sort_order}</ResponsiveDataFact>
                </>
              }
              footer={
                <img
                  src={banner.image_url}
                  alt=""
                  className="aspect-video w-full rounded-lg bg-black-50 object-cover"
                  loading="lazy"
                />
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}

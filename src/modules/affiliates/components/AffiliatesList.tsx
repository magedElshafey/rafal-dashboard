import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { AffiliateStatusBadge } from '@/modules/affiliates/components/AffiliateStatusBadge'
import type { Affiliate } from '@/modules/affiliates/types/affiliate.types'
import { formatDate, resolveAppLocale } from '@/utils/date/date.helpers'
import { Routes } from '@/routes/routes'

export function AffiliatesList({ affiliates }: { affiliates: readonly Affiliate[] }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const columns = [
    { id: 'affiliate', header: t('affiliates.fields.affiliate') },
    { id: 'contact', header: t('affiliates.fields.contact') },
    { id: 'social', header: t('affiliates.fields.social') },
    { id: 'code', header: t('affiliates.fields.code') },
    { id: 'status', header: t('affiliates.fields.status') },
    { id: 'created', header: t('affiliates.fields.createdAt') },
  ]

  const createdDate = (affiliate: Affiliate) => formatDate(affiliate.createdAt, { locale }) || '—'

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns} aria-label={t('affiliates.listTitle')}>
          {affiliates.map((affiliate) => (
            <ResponsiveDataTableRow key={affiliate.id}>
              <ResponsiveDataTableCell className="min-w-44 font-medium">
                <Link className="underline-offset-4 hover:underline" to={Routes.affiliateDetailPath(affiliate.id)}>
                  {affiliate.name}
                </Link>
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="min-w-56 space-y-1 normal-case">
                <a className="block" dir="ltr" href={`mailto:${affiliate.email}`}>
                  {affiliate.email}
                </a>
                <a className="block text-sm text-muted-foreground" dir="ltr" href={`tel:${affiliate.mobile}`}>
                  {affiliate.mobile}
                </a>
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="min-w-36">
                <span className="block capitalize">{affiliate.platform}</span>
                <bdi className="block text-sm text-muted-foreground">{affiliate.username}</bdi>
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                <code dir="ltr" className="rounded bg-muted px-2 py-1 font-semibold">
                  {affiliate.code}
                </code>
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                <AffiliateStatusBadge status={affiliate.status} />
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                <time dateTime={affiliate.createdAt}>{createdDate(affiliate)}</time>
              </ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {affiliates.map((affiliate) => (
          <ResponsiveDataMobileCard
            key={affiliate.id}
            title={
              <Link className="underline-offset-4 hover:underline" to={Routes.affiliateDetailPath(affiliate.id)}>
                {affiliate.name}
              </Link>
            }
            subtitle={
              <a dir="ltr" href={`mailto:${affiliate.email}`}>
                {affiliate.email}
              </a>
            }
            facts={
              <>
                <ResponsiveDataFact label={t('affiliates.fields.mobile')}>
                  <a dir="ltr" href={`tel:${affiliate.mobile}`}>
                    {affiliate.mobile}
                  </a>
                </ResponsiveDataFact>
                <ResponsiveDataFact label={t('affiliates.fields.social')}>
                  <span className="capitalize">{affiliate.platform}</span>{' '}
                  <bdi className="text-muted-foreground">{affiliate.username}</bdi>
                </ResponsiveDataFact>
                <ResponsiveDataFact label={t('affiliates.fields.code')}>
                  <code dir="ltr" className="font-semibold">
                    {affiliate.code}
                  </code>
                </ResponsiveDataFact>
                <ResponsiveDataFact label={t('affiliates.fields.status')}>
                  <AffiliateStatusBadge status={affiliate.status} />
                </ResponsiveDataFact>
                <ResponsiveDataFact label={t('affiliates.fields.createdAt')}>
                  <time dateTime={affiliate.createdAt}>{createdDate(affiliate)}</time>
                </ResponsiveDataFact>
              </>
            }
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}

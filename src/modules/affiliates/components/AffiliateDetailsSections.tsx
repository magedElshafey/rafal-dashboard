import { Link } from 'react-router-dom'
import { Routes } from '@/routes/routes'
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Skeleton } from '@/components/ui/skeleton'
import { AffiliateStatusBadge } from '@/modules/affiliates/components/AffiliateStatusBadge'
import type { Affiliate } from '@/modules/affiliates/types/affiliate.types'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="min-w-0">
      <DashboardCard padding="lg" className="h-full min-w-0 space-y-5">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {children}
      </DashboardCard>
    </section>
  )
}

function Facts({ facts, loading }: { facts: [string, ReactNode][]; loading: boolean }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {facts.map(([label, value]) => (
        <ResponsiveDataFact key={label} label={label} className="[overflow-wrap:anywhere]">
          {loading ? <Skeleton className="h-5 w-32 max-w-full" /> : value}
        </ResponsiveDataFact>
      ))}
    </dl>
  )
}

export function AffiliateDetailsSections({ affiliate }: { affiliate?: Affiliate }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const date = (value?: string) => formatDateTime(value, { locale }) || '—'
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <Section title={t('affiliates.detail.personal')}>
        <Facts
          loading={!affiliate}
          facts={[
            [t('affiliates.fields.name'), <bdi key="name">{affiliate?.name ?? '—'}</bdi>],
            [
              t('affiliates.fields.email'),
              affiliate ? (
                <a key="email" dir="ltr" href={`mailto:${affiliate.email}`}>
                  {affiliate.email}
                </a>
              ) : null,
            ],
            [
              t('affiliates.fields.mobile'),
              affiliate ? (
                <a key="mobile" dir="ltr" href={`tel:${affiliate.mobile}`}>
                  {affiliate.mobile}
                </a>
              ) : null,
            ],
          ]}
        />
      </Section>
      <Section title={t('affiliates.detail.social')}>
        <Facts
          loading={!affiliate}
          facts={[
            [t('affiliates.fields.platform'), <bdi key="platform">{affiliate?.platform || '—'}</bdi>],
            [t('affiliates.fields.username'), <bdi key="username">{affiliate?.username || '—'}</bdi>],
          ]}
        />
      </Section>
      <div className="lg:col-span-2">
        <Section title={t('affiliates.detail.account')}>
          <Facts
            loading={!affiliate}
            facts={[
              [
                t('affiliates.fields.code'),
                <code key="code" dir="ltr" className="rounded bg-muted px-2 py-1 font-semibold">
                  {affiliate?.code ?? '—'}
                </code>,
              ],
              [
                t('affiliates.fields.status'),
                affiliate ? <AffiliateStatusBadge key="status" status={affiliate.status} /> : null,
              ],
              [t('affiliates.fields.createdAt'), <time key="created">{date(affiliate?.createdAt)}</time>],
              [t('affiliates.fields.updatedAt'), <time key="updated">{date(affiliate?.updatedAt)}</time>],
              [t('affiliates.fields.source'), affiliate?.source || '—'],
              [
                t('affiliates.applications.title'),
                affiliate?.applicationId ? (
                  <Link
                    className="underline focus-visible:outline-ring"
                    to={Routes.affiliateApplicationDetailPath(affiliate.applicationId)}
                  >
                    {affiliate.applicationId}
                  </Link>
                ) : (
                  '—'
                ),
              ],
              [t('affiliates.fields.lastLogin'), date(affiliate?.lastLoginAt ?? undefined)],
              [t('affiliates.fields.termsAccepted'), date(affiliate?.termsAcceptedAt ?? undefined)],
            ]}
          />
        </Section>
      </div>
    </div>
  )
}

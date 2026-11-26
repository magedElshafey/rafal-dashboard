import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAffiliateAccess } from '../config/affiliate-access'
import { Routes } from '@/routes/routes'
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Skeleton } from '@/components/ui/skeleton'
import { AffiliateStatusBadge } from '@/modules/affiliates/components/AffiliateStatusBadge'
import type { Affiliate, AffiliateHistory } from '@/modules/affiliates/types/affiliate.types'
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
        <Section title={t('affiliates.fields.finances')}>
          <Facts
            loading={!affiliate}
            facts={(['pending', 'approvedUnpaid', 'paid'] as const).map((key) => [
              t('affiliates.fields.' + key),
              <bdi key={key}>
                {affiliate?.[key] == null
                  ? t('affiliates.summary.unavailable')
                  : `${affiliate[key]} ${t('affiliates.summary.currency')}`}
              </bdi>,
            ])}
          />
        </Section>
        {affiliate ? (
          <>
            <History kind="orders" history={affiliate.orders} />
            <History kind="payouts" history={affiliate.payouts} />
          </>
        ) : null}
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
              [t('affiliates.fields.reason'), <bdi key="reason">{affiliate?.statusReason || '—'}</bdi>],
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

function History({ kind, history }: { kind: 'orders' | 'payouts'; history?: AffiliateHistory | null }) {
  const { t, i18n } = useTranslation()
  const canReadPayouts = useAffiliateAccess('payouts')
  const [, setParams] = useSearchParams()
  const page = history?.meta?.current_page ?? 1
  const last = history?.meta?.last_page ?? 1
  const move = (value: number) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set(`${kind}_page`, String(value))
      return next
    })
  return (
    <Section title={t(`affiliates.history.${kind}`)}>
      {!history ? (
        <p>{t('affiliates.summary.unavailable')}</p>
      ) : !history.data.length ? (
        <p>{t('affiliates.history.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {history.data.map((row) => (
            <li key={row.id} className="flex flex-wrap gap-4 rounded border p-3">
              {kind === 'orders' || canReadPayouts ? (
                <Link
                  className="underline focus-visible:outline-ring"
                  to={kind === 'orders' ? Routes.orderDetailPath(row.id) : Routes.affiliatePayoutDetailPath(row.id)}
                >
                  <bdi>#{row.id}</bdi>
                </Link>
              ) : (
                <bdi>#{row.id}</bdi>
              )}
              <bdi>
                {row.status
                  ? t('affiliates.reviewStatus.' + row.status, { defaultValue: row.status })
                  : t('affiliates.summary.unavailable')}
              </bdi>
              <bdi>
                {(kind === 'orders' ? row.commission : row.amount) == null
                  ? t('affiliates.summary.unavailable')
                  : `${kind === 'orders' ? row.commission : row.amount} ${t('affiliates.summary.currency')}`}
              </bdi>
              <time>{formatDateTime(row.created_at ?? undefined, { locale: resolveAppLocale(i18n.language) })}</time>
              {kind === 'orders' ? (
                <dl>
                  <ResponsiveDataFact label={t('orders.affiliate.adjustment')}>
                    <bdi>
                      {row.adjustment_amount == null
                        ? t('affiliates.summary.unavailable')
                        : `${row.adjustment_amount} ${t('affiliates.summary.currency')}`}
                    </bdi>
                  </ResponsiveDataFact>
                </dl>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {last > 1 ? (
        <nav aria-label={t(`affiliates.history.${kind}`)} className="flex gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => move(page - 1)}>
            {t('affiliates.history.previous')}
          </Button>
          <span>
            {page} / {last}
          </span>
          <Button variant="outline" disabled={page >= last} onClick={() => move(page + 1)}>
            {t('affiliates.history.next')}
          </Button>
        </nav>
      ) : null}
    </Section>
  )
}

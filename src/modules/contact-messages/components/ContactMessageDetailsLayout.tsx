import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import type { ContactMessage } from '../types/contact-message.types'
import {
  ContactMessageAccount,
  ContactMessageDate,
  ContactMessageStatusBadge,
  ContactMessageText,
} from './ContactMessagePresentation'
function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <DashboardCard padding="lg">
        <h2 id={headingId} className="mb-4 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </DashboardCard>
    </section>
  )
}
function Facts({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <dl className="space-y-3">
      {facts.map(([label, value]) => (
        <div key={label} className="grid min-w-0 gap-1 sm:grid-cols-2">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
export function ContactMessageDetailsLayout({
  message,
  actions,
  statusForm,
}: {
  message?: ContactMessage
  actions?: ReactNode
  statusForm?: ReactNode
}) {
  const { t } = useTranslation()
  const placeholder = <Skeleton className="h-5 w-32 max-w-full" />
  return (
    <>
      <DashboardPageHeader
        title={message ? t('contactMessages.detailTitle', { id: message.id }) : t('contactMessages.detailsTitle')}
        description={
          message ? (
            <ContactMessageStatusBadge message={message} />
          ) : (
            <span className="inline-block h-6 w-20 animate-pulse rounded-md bg-accent" />
          )
        }
        actions={message ? actions : <Skeleton className="h-10 w-24" />}
      />
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section title={t('contactMessages.fields.message')}>
          {message ? (
            <>
              <h3 className="mb-4 break-words text-lg font-medium [overflow-wrap:anywhere]" dir="auto">
                <ContactMessageText value={message.subject} />
              </h3>
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]" dir="auto">
                <ContactMessageText value={message.message} />
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}
        </Section>
        <div className="min-w-0 space-y-4">
          <Section title={t('contactMessages.contactInformation')}>
            <Facts
              facts={(['name', 'email', 'phone'] as const).map((field) => {
                const value = message?.[field] ?? null
                return [
                  t(`contactMessages.fields.${field}`),
                  message ? <ContactMessageText value={value} /> : placeholder,
                ]
              })}
            />
          </Section>
          <Section title={t('contactMessages.fields.account')}>
            {message ? (
              <ContactMessageAccount user={message.user} />
            ) : (
              <div className="space-y-2">
                {placeholder}
                {placeholder}
              </div>
            )}
          </Section>
          <Section title={t('contactMessages.fields.status')}>
            <div className="mb-4">{message ? <ContactMessageStatusBadge message={message} /> : placeholder}</div>
            {message ? (
              statusForm
            ) : (
              <div className="space-y-3">
                {placeholder}
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-28" />
              </div>
            )}
          </Section>
          <Section title={t('contactMessages.dates')}>
            <Facts
              facts={[
                [
                  t('contactMessages.fields.createdAt'),
                  message ? <ContactMessageDate value={message.createdAt} /> : placeholder,
                ],
                [
                  t('contactMessages.fields.updatedAt'),
                  message ? <ContactMessageDate value={message.updatedAt} /> : placeholder,
                ],
              ]}
            />
          </Section>
        </div>
      </div>
    </>
  )
}

import { useState, type ReactNode } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Routes } from '@/routes/routes'
import { ContactMessageDeleteDialog } from '../components/ContactMessageDeleteDialog'
import {
  ContactMessageAccount,
  ContactMessageDate,
  ContactMessageStatusBadge,
  ContactMessageText,
} from '../components/ContactMessagePresentation'
import { ContactMessageStatusForm } from '../components/ContactMessageStatusForm'
import { useContactMessage } from '../hooks/useContactMessages'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import type { ContactMessage } from '../types/contact-message.types'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border bg-surface p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
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
function Content({ message, refreshing }: { message: ContactMessage; refreshing: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const pending = useIsMutating({ mutationKey: contactMessagesKeys.mutation(message.id) }) > 0
  return (
    <>
      <DashboardPageHeader
        title={t('contactMessages.detailTitle', { id: message.id })}
        description={<ContactMessageStatusBadge message={message} />}
        actions={
          <Button
            variant="destructive"
            disabled={pending || refreshing}
            onClick={() => setDeleting(true)}
            aria-label={t('contactMessages.deleteNamed', { id: message.id })}
          >
            {t('contactMessages.delete')}
          </Button>
        }
      />
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section title={t('contactMessages.fields.message')}>
          <h3 className="mb-4 break-words text-lg font-medium" dir="auto">
            <ContactMessageText value={message.subject} />
          </h3>
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]" dir="auto">
            <ContactMessageText value={message.message} />
          </p>
        </Section>
        <div className="min-w-0 space-y-4">
          <Section title={t('contactMessages.contactInformation')}>
            <Facts
              facts={['name', 'email', 'phone'].map((field) => {
                const value = field === 'name' ? message.name : field === 'email' ? message.email : message.phone
                return [t(`contactMessages.fields.${field}`), <ContactMessageText value={value} />]
              })}
            />
          </Section>
          <Section title={t('contactMessages.fields.account')}>
            <ContactMessageAccount user={message.user} />
          </Section>
          <Section title={t('contactMessages.fields.status')}>
            <div className="mb-4">
              <ContactMessageStatusBadge message={message} />
            </div>
            <ContactMessageStatusForm message={message} disabled={pending || refreshing || deleting} />
          </Section>
          <Section title={t('contactMessages.dates')}>
            <Facts
              facts={[
                [t('contactMessages.fields.createdAt'), <ContactMessageDate value={message.createdAt} />],
                [t('contactMessages.fields.updatedAt'), <ContactMessageDate value={message.updatedAt} />],
              ]}
            />
          </Section>
        </div>
      </div>
      {deleting ? (
        <ContactMessageDeleteDialog
          target={message}
          onClose={() => setDeleting(false)}
          onDeleted={() => navigate(Routes.contactMessages, { replace: true })}
        />
      ) : null}
    </>
  )
}
export default function ContactMessageDetailPage() {
  const { id: rawId } = useParams()
  const id = rawId && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : NaN
  const query = useContactMessage(id)
  const { t } = useTranslation()
  return (
    <main className="min-w-0 space-y-4">
      <Button variant="outline" asChild>
        <Link to={Routes.contactMessages}>{t('contactMessages.back')}</Link>
      </Button>
      {!Number.isSafeInteger(id) ? (
        <p role="alert">{t('contactMessages.invalidId')}</p>
      ) : (
        <QueryStateBoundary
          isLoading={query.isLoading}
          loadingFallback={
            <div aria-hidden="true" className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-20 lg:col-span-2" />
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          }
          isLoadingError={query.isError && !query.data}
          isRefetchError={query.isRefetchError}
          isPaused={query.isPaused}
          isFetching={query.isFetching}
          hasData={Boolean(query.data)}
          onRetry={query.refetch}
        >
          {query.data ? (
            <Content key={id} message={query.data} refreshing={query.isFetching || query.isRefetchError} />
          ) : null}
        </QueryStateBoundary>
      )}
    </main>
  )
}

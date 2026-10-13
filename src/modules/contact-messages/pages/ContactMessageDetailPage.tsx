import { useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { Routes } from '@/routes/routes'
import { ContactMessageDeleteDialog } from '../components/ContactMessageDeleteDialog'
import { ContactMessageDetailsLayout } from '../components/ContactMessageDetailsLayout'
import { ContactMessageStatusForm } from '../components/ContactMessageStatusForm'
import { useContactMessage } from '../hooks/useContactMessages'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import type { ContactMessage } from '../types/contact-message.types'

function Content({ message, uncertain }: { message: ContactMessage; uncertain: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const pending = useIsMutating({ mutationKey: contactMessagesKeys.mutation(message.id) }) > 0
  return (
    <>
      <ContactMessageDetailsLayout
        message={message}
        actions={
          <Button
            variant="destructive"
            disabled={pending || uncertain}
            onClick={() => setDeleting(true)}
            aria-label={t('contactMessages.deleteNamed', { id: message.id })}
          >
            {t('contactMessages.delete')}
          </Button>
        }
        statusForm={<ContactMessageStatusForm message={message} disabled={pending || uncertain || deleting} />}
      />
      {deleting ? (
        <ContactMessageDeleteDialog
          target={message}
          disabled={uncertain}
          requireDetail
          onClose={() => setDeleting(false)}
          onDeleted={() => navigate(Routes.contactMessages, { replace: true })}
        />
      ) : null}
    </>
  )
}
function NotFound() {
  const { t } = useTranslation()
  return (
    <DashboardPageHeader
      title={t('contactMessages.notFound.title')}
      description={t('contactMessages.notFound.description')}
    />
  )
}
function Detail({ id }: { id: number }) {
  const query = useContactMessage(id)
  const { t } = useTranslation()
  if (!query.data && isAxiosError(query.error) && query.error.response?.status === 404) return <NotFound />
  return (
    <>
      {!query.data && (query.isError || query.isPaused) ? (
        <DashboardPageHeader title={t('contactMessages.detailsTitle')} />
      ) : null}
      <QueryStateBoundary
        isLoading={query.isLoading}
        loadingFallback={<ContactMessageDetailsLayout />}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? (
          <Content
            key={id}
            message={query.data}
            uncertain={query.isFetching || query.isPaused || query.isRefetchError}
          />
        ) : null}
      </QueryStateBoundary>
    </>
  )
}
export default function ContactMessageDetailPage() {
  const { id: rawId } = useParams()
  const id = rawId && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : NaN
  const { t } = useTranslation()
  return (
    <main className="min-w-0 space-y-4">
      <Button variant="outline" asChild>
        <Link to={Routes.contactMessages}>{t('contactMessages.back')}</Link>
      </Button>
      {Number.isSafeInteger(id) ? <Detail id={id} /> : <NotFound />}
    </main>
  )
}

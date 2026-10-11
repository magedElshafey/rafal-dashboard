import { isAxiosError } from 'axios'
import { UserRoundX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/empty-state'
import { CustomerDetailsHeader } from '../components/CustomerDetailsHeader'
import { CustomerDetailsLayout } from '../components/CustomerDetailsLayout'
import { useCustomer } from '../hooks/useCustomer'

function CustomerNotFound() {
  const { t } = useTranslation()
  return (
    <main className="min-w-0">
      <CustomerDetailsHeader />
      <EmptyState
        icon={<UserRoundX />}
        title={t('customers.detail.invalid.title')}
        description={t('customers.detail.invalid.description')}
      />
    </main>
  )
}

function CustomerDetails({ id }: { id: number }) {
  const query = useCustomer(id)
  if (!query.data && isAxiosError(query.error) && query.error.response?.status === 404) return <CustomerNotFound />
  return <CustomerDetailsLayout customerId={id} query={query} />
}

export default function CustomerDetailPage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  if (!/^[1-9]\d*$/.test(routeId ?? '') || !Number.isSafeInteger(id)) return <CustomerNotFound />
  return <CustomerDetails key={id} id={id} />
}

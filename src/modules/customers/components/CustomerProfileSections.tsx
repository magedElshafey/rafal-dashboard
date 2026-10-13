import { useTranslation } from 'react-i18next'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { CustomerDetail } from '../types/customer.types'
import { CustomerDetailsFacts, CustomerDetailsSection } from './CustomerDetailsSection'
import { CustomerStatusBadge, CustomerAccessBadge } from './CustomerStatusBadges'

export function CustomerProfileSections({ customer }: { customer?: CustomerDetail }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const date = (value: string | null | undefined) => formatDateTime(value, { locale }) || '—'
  return (
    <div className="space-y-5">
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <CustomerDetailsSection title={t('customers.detail.identity')}>
          <CustomerDetailsFacts
            loading={!customer}
            facts={[
              [t('customers.fields.id'), customer?.id ?? '—'],
              [t('customers.fields.firstName'), customer?.firstName?.trim() || '—'],
              [t('customers.fields.lastName'), customer?.lastName?.trim() || '—'],
              [t('customers.fields.email'), customer?.email?.trim() || '—'],
              [t('customers.fields.phone'), customer?.phone?.trim() || '—'],
            ]}
          />
        </CustomerDetailsSection>
        <CustomerDetailsSection title={t('customers.detail.account')}>
          <CustomerDetailsFacts
            loading={!customer}
            facts={[
              [t('customers.fields.status'), customer ? <CustomerStatusBadge status={customer.status} /> : null],
              [
                t('customers.fields.marketingOptIn'),
                t(customer?.marketingOptIn ? 'customers.values.yes' : 'customers.values.no'),
              ],
              [t('customers.fields.termsAcceptedAt'), date(customer?.termsAcceptedAt)],
              [
                t('customers.fields.addressesCount'),
                customer ? new Intl.NumberFormat(locale).format(customer.addressesCount) : null,
              ],
              [t('customers.detail.memberSince'), date(customer?.createdAt)],
            ]}
          />
        </CustomerDetailsSection>
      </div>
      <CustomerDetailsSection title={t('customers.detail.access')}>
        <CustomerDetailsFacts
          loading={!customer}
          facts={[
            [t('customers.fields.access'), customer ? <CustomerAccessBadge isBlocked={customer.isBlocked} /> : null],
            [t('customers.fields.blockedAt'), date(customer?.blockedAt)],
          ]}
        />
      </CustomerDetailsSection>
    </div>
  )
}

export function CustomerMetadataSection({ customer }: { customer?: CustomerDetail }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  return (
    <CustomerDetailsSection title={t('customers.detail.metadata')}>
      <CustomerDetailsFacts
        loading={!customer}
        facts={[
          [t('customers.fields.createdAt'), formatDateTime(customer?.createdAt, { locale }) || '—'],
          [t('customers.fields.updatedAt'), formatDateTime(customer?.updatedAt, { locale }) || '—'],
        ]}
      />
    </CustomerDetailsSection>
  )
}

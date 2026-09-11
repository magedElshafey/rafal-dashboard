import { Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Container } from '@/components/core/Container'
import { Section } from '@/components/core/Section'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { type AppLanguage, useAppLanguage } from '../hooks/useAppLanguage'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { PortalLink } from '@/components/core/portal-link/components/PortalLink'
import { useAuth } from '@/store/auth'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { language, changeLanguage } = useAppLanguage()

  const role = useAuth((state) => state.role)

  const shouldShowBreadcrumb = role === 'student' || role === 'parent'
  const usesTeacherPortalLayout = role === 'admin' || role === 'assistant' || role === 'teacher'

  const content = (
    <>
      {shouldShowBreadcrumb && (
        <Breadcrumb aria-label={t('settings.breadcrumb_label')}>
          <BreadcrumbList className="text-content-secondary">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <PortalLink to="/home">{t('settings.home')}</PortalLink>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-content-primary">{t('settings.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {usesTeacherPortalLayout ? (
        <DashboardPageHeader titleId="settings-title" title={t('settings.title')} />
      ) : (
        <h1 id="settings-title" className="text-2xl font-semibold leading-8 text-neutral-900 md:text-3xl">
          {t('settings.title')}
        </h1>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-black-50 text-content-secondary">
            <Globe2 className="size-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">{t('settings.language')}</p>

            <p className="text-xs text-neutral-700">{t('settings.language_description')}</p>
          </div>
        </div>

        <Select value={language} onValueChange={(value) => void changeLanguage(value as AppLanguage)}>
          <SelectTrigger className="h-11 w-full shrink-0 rounded-xl sm:w-40" aria-label={t('settings.language_select')}>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="en">{t('settings.languages.en')}</SelectItem>

            <SelectItem value="ar">{t('settings.languages.ar')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )

  if (usesTeacherPortalLayout) {
    return (
      <section aria-labelledby="settings-title" className="space-y-6">
        {content}
      </section>
    )
  }

  return (
    <Section aria-labelledby="settings-title">
      <Container className="space-y-7 md:space-y-8">{content}</Container>
    </Section>
  )
}

import { useTranslation } from 'react-i18next'

import { useAuth } from '@/store/auth'

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuth((state) => state.user)

  return (
    <main className="p-6 sm:p-10">
      <div className="mx-auto max-w-6xl rounded-xl border border-border bg-background p-6 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">{t('dashboard.brand')}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t('dashboard.title')}</h1>
          {user?.name ? (
            <p className="mt-2 text-muted-foreground">{t('dashboard.welcome', { name: user.name })}</p>
          ) : null}
        </div>
      </div>
    </main>
  )
}

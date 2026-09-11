import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useLogout } from '@/modules/auth/hooks/useLogout'
import { useAuth } from '@/store/auth'

export default function DashboardPage() {
  const { t } = useTranslation()
  const logout = useLogout()
  const user = useAuth((state) => state.user)

  return (
    <main className="min-h-screen bg-background p-6 sm:p-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('dashboard.brand')}</p>
          <h1 className="text-3xl font-semibold text-foreground">{t('dashboard.title')}</h1>
          {user?.name ? (
            <p className="mt-2 text-muted-foreground">{t('dashboard.welcome', { name: user.name })}</p>
          ) : null}
        </div>
        <Button type="button" variant="outline" onClick={logout}>
          {t('auth.logout.confirm')}
        </Button>
      </div>
    </main>
  )
}

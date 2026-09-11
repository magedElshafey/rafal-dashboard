import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useTheme } from '@/components/theme/ThemeProvider'
import { Button } from '@/components/ui/button'

export function DashboardThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t(isDark ? 'dashboard.topbar.useLightTheme' : 'dashboard.topbar.useDarkTheme')}
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
    </Button>
  )
}

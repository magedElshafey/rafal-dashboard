import { Maximize, Minimize } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFullscreen } from '@/hooks/useFullscreen'

export function DashboardFullscreenToggle() {
  const { t } = useTranslation()
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen()

  if (!isSupported) return null

  const label = t(isFullscreen ? 'dashboard.topbar.exitFullscreen' : 'dashboard.topbar.enterFullscreen')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={() => void toggleFullscreen()}>
          {isFullscreen ? <Minimize className="size-5" aria-hidden /> : <Maximize className="size-5" aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

export default function MainErrorButtons({ className }: { className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className={cn('flex gap-3', className)}>
      <Button onClick={() => navigate(-1)} variant="outline" className="font-semibold">
        {t('errors.go_back')}
      </Button>

      <Button asChild className="font-semibold">
        <Link to="/">{t('errors.back_to_home')}</Link>
      </Button>
    </div>
  )
}

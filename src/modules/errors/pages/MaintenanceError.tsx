// hooks
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

// components
import { Button } from '@/components/ui/button'
import ErrorsPageLayout from '@/modules/errors/components/errorsPageLayout'

export default function MaintenanceErrorPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <ErrorsPageLayout
      title="maintenance_error_title"
      desc1="maintenance_error_desc1"
      desc2="maintenance_error_desc2"
      code="503"
      mainButton={
        <Button onClick={() => navigate(-1)} variant="outline" className="font-semibold">
          {t('errors.learn_more')}
        </Button>
      }
    />
  )
}

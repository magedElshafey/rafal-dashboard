// components
import ErrorsPageLayout from '@/modules/errors/components/errorsPageLayout'

export default function ForbiddenPage() {
  return (
    <ErrorsPageLayout title="unauthorized_title" desc1="unauthorized_desc1" desc2="unauthorized_desc2" code="401" />
  )
}

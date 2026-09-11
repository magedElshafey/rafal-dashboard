import ErrorsPageLayout from '@/modules/errors/components/errorsPageLayout'

export default function InternalServerErrorPage() {
  return (
    <ErrorsPageLayout
      title="internal_server_error_title"
      desc1="internal_server_error_desc1"
      desc2="internal_server_error_desc2"
      code="500"
    />
  )
}

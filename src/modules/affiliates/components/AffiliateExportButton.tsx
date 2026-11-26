import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getQueryClientAuthBoundaryEpoch } from '@/lib/react-query/query-client'
import { downloadBlobFile, getDownloadFilename } from '@/utils/files/download-blob-file'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
import { affiliatesService } from '../api/affiliates.service'
import type { AffiliateFilters } from '../types/affiliate.types'

export function AffiliateExportButton({ filters }: { filters: AffiliateFilters }) {
  const { t } = useTranslation()
  const request = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false)
  useEffect(() => () => request.current?.abort(), [])
  const download = async () => {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    const epoch = getQueryClientAuthBoundaryEpoch()
    setPending(true)
    try {
      const response = await affiliatesService.export(filters, controller.signal)
      if (controller.signal.aborted || epoch !== getQueryClientAuthBoundaryEpoch()) return
      downloadBlobFile({
        blob: response.data,
        filename: getDownloadFilename(response.headers['content-disposition'], 'affiliates.csv', '.csv'),
        fallbackFilename: 'affiliates.csv',
      })
    } catch (error) {
      if (!controller.signal.aborted && epoch === getQueryClientAuthBoundaryEpoch())
        toastApiError(error, t('affiliates.feedback.exportError'), true)
    } finally {
      request.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return (
    <Button type="button" variant="outline" disabled={pending} onClick={() => void download()}>
      {t('affiliates.actions.export')}
    </Button>
  )
}

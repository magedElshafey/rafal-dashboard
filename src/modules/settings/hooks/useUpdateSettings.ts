import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { settingsService } from '@/modules/settings/api/settings.service'
import { settingsKeys } from '@/modules/settings/queries/settings.keys'
import type { SettingsUpdatePayload } from '@/modules/settings/types/settings.types'

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: SettingsUpdatePayload) => settingsService.update(payload),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKeys.detail(), settings)
      toast.success(t('settings.feedback.updated'))
    },
    onError: () => toast.error(t('settings.feedback.updateError')),
  })
}

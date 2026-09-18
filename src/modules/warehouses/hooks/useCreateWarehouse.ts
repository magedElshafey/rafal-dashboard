import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'
import type { WarehousePayload } from '@/modules/warehouses/types/warehouse.types'

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: WarehousePayload) => warehousesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: warehousesKeys.lists() })
      toast.success(t('warehouses.feedback.created'))
    },
    onError: () => toast.error(t('warehouses.feedback.createError')),
  })
}

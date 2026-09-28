import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'
import type { WarehouseCreatePayload } from '@/modules/warehouses/types/warehouse.types'
import { isWarehouseCityConflict } from '@/modules/warehouses/utils/warehouse-error.utils'

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: WarehouseCreatePayload) => warehousesService.create(payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(warehousesKeys.detail(response.data.id), response)
      await queryClient.invalidateQueries({ queryKey: warehousesKeys.lists() })
      toast.success(t('warehouses.feedback.created'))
    },
    onError: (error) =>
      toast.error(
        t(isWarehouseCityConflict(error) ? 'warehouses.errors.cityConflict' : 'warehouses.feedback.createError')
      ),
  })
}

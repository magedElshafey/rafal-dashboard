import { isAxiosError } from 'axios'

function getErrorMessage(error: unknown) {
  if (!isAxiosError(error)) return ''
  const message = error.response?.data?.message
  return typeof message === 'string' ? message : ''
}

export function isWarehouseCityConflict(error: unknown) {
  return getErrorMessage(error).includes('already assigned')
}

export function isWarehouseStockConflict(error: unknown) {
  return getErrorMessage(error).includes('still has stock')
}

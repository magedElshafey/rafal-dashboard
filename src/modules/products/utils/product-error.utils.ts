import { isAxiosError } from 'axios'

export function isProductVariantDeleteConflict(error: unknown) {
  if (!isAxiosError(error)) return false
  const message = error.response?.data?.message
  return typeof message === 'string' && message.toLowerCase().includes('still has variants')
}

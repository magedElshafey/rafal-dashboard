import { toast } from 'sonner'
import { getApiErrorMessage } from './api-error.helpers'

export function toastApiError(error: unknown, fallbackMessage: string) {
  toast.error(getApiErrorMessage(error, fallbackMessage))
}

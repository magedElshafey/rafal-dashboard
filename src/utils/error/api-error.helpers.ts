import { isAxiosError } from 'axios'

export function getApiErrorMessage(error: unknown, fallbackMessage: string, useBackendMessage = false): string {
  if (useBackendMessage && isAxiosError(error)) {
    const body: unknown = error.response?.data
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.trim()
    ) {
      return body.message
    }
  }
  return fallbackMessage
}

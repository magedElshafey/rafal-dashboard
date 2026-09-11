import { handleErrorFields } from '@/utils/error/errorHandler'
import { isAxiosError } from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const message = value.trim()
  return message.length > 0 ? message : null
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!isAxiosError<unknown>(error)) return fallbackMessage

  const responseData = error.response?.data
  if (!isRecord(responseData)) return fallbackMessage

  const fieldsErrorMessage = isRecord(responseData.errors) ? handleErrorFields(responseData.errors) : null
  const nestedData = isRecord(responseData.data) ? responseData.data : null

  return (
    readMessage(fieldsErrorMessage) ??
    readMessage(responseData.message) ??
    readMessage(responseData.error) ??
    readMessage(nestedData?.message) ??
    fallbackMessage
  )
}

import { isAxiosError } from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function resolveAlias<TValues extends FieldValues>(field: string, aliases: Readonly<Record<string, Path<TValues>>>) {
  if (aliases[field]) return aliases[field]
  const dottedField = field.replace(/\[([^\]]+)\]/g, '.$1')
  const wildcardField = dottedField.replace(/\.\d+(?=\.|$)/g, '.*')
  return aliases[dottedField] ?? aliases[wildcardField]
}

export function applyApiValidationErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  fieldAliases: Readonly<Record<string, Path<TValues>>> = {}
) {
  if (!isAxiosError(error) || !isRecord(error.response?.data)) return false
  const errors = error.response.data.errors
  if (!isRecord(errors)) return false

  let applied = false
  Object.entries(errors).forEach(([field, messages]) => {
    const message = Array.isArray(messages) ? messages.find((item) => typeof item === 'string') : undefined
    if (!message) return
    setError(resolveAlias(field, fieldAliases) ?? (field as Path<TValues>), { type: 'server', message })
    applied = true
  })
  return applied
}

type UnknownRecord = Record<string, unknown>

export function isObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

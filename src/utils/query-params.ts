export type QueryParamPrimitive = string | number | boolean
export type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[] | null | undefined
export type QueryParams = Record<string, QueryParamValue>

const isEmptyQueryValue = (value: QueryParamValue) => {
  if (value === null || value === undefined || value === '') return true

  if (Array.isArray(value)) {
    return value.length === 0
  }

  return false
}

export function cleanQueryParams<T extends QueryParams>(params?: T | null) {
  if (!params) return undefined

  const cleanedParams = Object.entries(params).reduce<QueryParams>((acc, [key, value]) => {
    if (!isEmptyQueryValue(value)) {
      acc[key] = value
    }

    return acc
  }, {})

  return Object.keys(cleanedParams).length ? cleanedParams : undefined
}

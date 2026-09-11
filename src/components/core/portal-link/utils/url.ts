function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}

export function joinPath(...parts: Array<string | null | undefined>) {
  const path = parts
    .map((part) => (part ? trimSlashes(part) : ''))
    .filter(Boolean)
    .join('/')

  return `/${path}`
}

export function joinUrl(origin: string, ...paths: Array<string | null | undefined>) {
  const normalizedOrigin = origin.replace(/\/+$/, '')
  const normalizedPath = joinPath(...paths)

  return `${normalizedOrigin}${normalizedPath}`
}

export type DownloadBlobFile = {
  blob: Blob
  filename: string
  fallbackFilename: string
}

export function getDownloadFilename(
  contentDisposition: unknown,
  fallbackFilename: string,
  extension?: `.${string}`
): string {
  const disposition = typeof contentDisposition === 'string' ? contentDisposition : ''
  const encoded = disposition.match(/filename\*\s*=\s*(?:UTF-8'[^']*')?([^;]+)/i)?.[1]
  const regular = disposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i)
  const raw = encoded ? decodeFilename(encoded) : regular?.[1] || regular?.[2] || fallbackFilename
  const safe = sanitizeDownloadFilename(raw) || sanitizeDownloadFilename(fallbackFilename)

  if (!extension) return safe

  return safe.toLowerCase().endsWith(extension.toLowerCase()) ? safe : `${safe.replace(/\.[^.]+$/, '')}${extension}`
}

export function downloadBlobFile({ blob, filename, fallbackFilename }: DownloadBlobFile): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = url
    link.download = sanitizeDownloadFilename(filename) || sanitizeDownloadFilename(fallbackFilename)
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

function decodeFilename(value: string): string {
  const normalized = value.trim().replace(/^"|"$/g, '')

  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

function sanitizeDownloadFilename(value: string): string {
  const withoutPathCharacters = value.trim().replace(/[<>:"/\\|?*]/g, '_')
  const withoutControls = Array.from(withoutPathCharacters, (character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127 ? '_' : character
  }).join('')

  return withoutControls
    .replace(/^\.+/, '')
    .replace(/[. ]+$/, '')
    .slice(0, 200)
}

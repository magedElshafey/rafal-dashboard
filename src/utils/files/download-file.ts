import { downloadBlobFile, getDownloadFilename } from './download-blob-file'

export type DownloadFileResult = 'downloaded' | 'opened-fallback' | 'failed'

export type DownloadFileOptions = {
  url: string
  filename?: string
  fallbackFilename?: string
  requestInit?: RequestInit
}

type DownloadFileDependencies = {
  fetchFile?: typeof fetch
  saveBlobFile?: typeof downloadBlobFile
  openFallback?: (url: string) => boolean
}

export async function downloadFileWithFallback(
  { url, filename, fallbackFilename = 'download', requestInit }: DownloadFileOptions,
  dependencies: DownloadFileDependencies = {}
): Promise<DownloadFileResult> {
  const safeUrl = getSafeDownloadUrl(url)
  if (!safeUrl) return 'failed'

  try {
    const fetchFile = dependencies.fetchFile ?? fetch
    const response = requestInit ? await fetchFile(safeUrl, requestInit) : await fetchFile(safeUrl)
    if (!response.ok) throw new Error(`Download failed with status ${response.status}`)

    const blob = await response.blob()
    const urlFilename = getUrlFilename(safeUrl)
    const resolvedFilename = filename?.trim()
      ? filename
      : getDownloadFilename(response.headers.get('content-disposition'), urlFilename || fallbackFilename)

    ;(dependencies.saveBlobFile ?? downloadBlobFile)({
      blob,
      filename: resolvedFilename,
      fallbackFilename,
    })

    return 'downloaded'
  } catch {
    try {
      const fallbackOpened = (dependencies.openFallback ?? openInNewTab)(safeUrl)
      return fallbackOpened ? 'opened-fallback' : 'failed'
    } catch {
      return 'failed'
    }
  }
}

export function getSafeDownloadUrl(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  if (!normalized || typeof window === 'undefined') return null

  try {
    const url = new URL(normalized, window.location.origin)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function openInNewTab(url: string): boolean {
  return Boolean(window.open(url, '_blank', 'noopener,noreferrer'))
}

function getUrlFilename(value: string): string {
  try {
    return decodeURIComponent(new URL(value).pathname.split('/').pop() ?? '')
  } catch {
    return ''
  }
}

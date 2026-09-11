import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadBlobFile } from './download-blob-file'
import { downloadFileWithFallback } from './download-file'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('downloadFileWithFallback', () => {
  it('fetches once and saves a Blob with the explicit backend filename without opening a tab', async () => {
    const blob = new Blob(['file'])
    const fetchFile = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(blob, {
        headers: { 'content-disposition': 'attachment; filename="response-name.txt"' },
      })
    )
    const saveBlobFile = vi.fn()
    const openFallback = vi.fn()

    await expect(
      downloadFileWithFallback(
        { url: 'https://cdn.example.com/source.txt', filename: 'backend-name.txt' },
        { fetchFile, saveBlobFile, openFallback }
      )
    ).resolves.toBe('downloaded')

    expect(fetchFile).toHaveBeenCalledOnce()
    expect(fetchFile).toHaveBeenCalledWith('https://cdn.example.com/source.txt')
    expect(saveBlobFile).toHaveBeenCalledWith({
      blob: expect.any(Blob),
      filename: 'backend-name.txt',
      fallbackFilename: 'download',
    })
    expect(openFallback).not.toHaveBeenCalled()
  })

  it('opens the original URL in a safe new tab after any primary failure', async () => {
    const fetchFile = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('CORS blocked'))
    const open = vi.fn().mockReturnValue({ closed: false })
    vi.stubGlobal('open', open)

    await expect(downloadFileWithFallback({ url: 'https://cdn.example.com/file.pdf' }, { fetchFile })).resolves.toBe(
      'opened-fallback'
    )

    expect(open).toHaveBeenCalledWith('https://cdn.example.com/file.pdf', '_blank', 'noopener,noreferrer')
  })

  it('fails gracefully when the fallback popup is blocked without current-tab navigation', async () => {
    const fetchFile = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 }))
    const open = vi.fn().mockReturnValue(null)
    vi.stubGlobal('open', open)

    await expect(downloadFileWithFallback({ url: 'https://cdn.example.com/file.pdf' }, { fetchFile })).resolves.toBe(
      'failed'
    )

    expect(open).toHaveBeenCalledWith('https://cdn.example.com/file.pdf', '_blank', 'noopener,noreferrer')
  })
})

describe('downloadBlobFile', () => {
  it('clicks a temporary anchor and cleans up the element and object URL', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn(() => 'blob:download')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const anchor = document.createElement('a')
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined)
    const remove = vi.spyOn(anchor, 'remove')
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    downloadBlobFile({ blob: new Blob(['file']), filename: 'notes.pdf', fallbackFilename: 'download.pdf' })

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(createElement).toHaveBeenCalledWith('a')
    expect(anchor.download).toBe('notes.pdf')
    expect(click).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledOnce()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download')
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FileAttachmentItem } from './FileAttachmentItem'

const downloadFileWithFallback = vi.hoisted(() => vi.fn().mockResolvedValue('downloaded'))
vi.mock('@/utils/files/download-file', () => ({ downloadFileWithFallback }))

describe('FileAttachmentItem', () => {
  it('uses the canonical download path for assignment and exam attachments', async () => {
    const user = userEvent.setup()
    const file = {
      id: 'file-1',
      name: 'Worksheet',
      file_name: 'worksheet.docx',
      url: 'https://cdn.example.com/worksheet.docx',
      size: 2048,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    } as Media

    render(<FileAttachmentItem file={file} ariaLabel="Download worksheet.docx" />)

    await user.click(screen.getByRole('button', { name: 'Download worksheet.docx' }))
    expect(downloadFileWithFallback).toHaveBeenCalledWith({
      url: file.url,
      filename: file.file_name,
      fallbackFilename: file.file_name,
    })
  })
})

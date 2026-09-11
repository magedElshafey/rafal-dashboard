import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { FileUploadBox, type FileUploadValidator } from '@/components/form/file-upload/FileUploadBox'
import { SingleFileUploadPanelField } from '@/components/form/file-upload/SingleFileUploadPanelField'
import { Form } from '@/components/ui/form'

type UploadFormValues = {
  file: File | null
}

function InvalidUploadHarness() {
  const form = useForm<UploadFormValues>({
    defaultValues: { file: null },
  })

  useEffect(() => {
    form.setError('file', { type: 'required', message: 'Choose a PDF file.' }, { shouldFocus: true })
  }, [form])

  return (
    <Form {...form}>
      <SingleFileUploadPanelField<UploadFormValues>
        name="file"
        browseButtonLabel="Browse PDF"
        helperText="PDF only, up to 50 MB"
      />
    </Form>
  )
}

function UploadModeHarness({
  initialFiles = [],
  multiple,
  validateFiles,
}: {
  initialFiles?: File[]
  multiple: boolean
  validateFiles: FileUploadValidator
}) {
  const [files, setFiles] = useState(initialFiles)

  return (
    <FileUploadBox
      files={files}
      onFilesChange={setFiles}
      multiple={multiple}
      browseButtonLabel="Browse PDF"
      removeFileLabel="Remove"
      validateFiles={validateFiles}
    />
  )
}

describe('FileUploadPanelField accessibility', () => {
  it('connects restriction and error text to the focused invalid input with a visible focus-within indicator', async () => {
    render(<InvalidUploadHarness />)

    const input = screen.getByLabelText('Browse PDF')

    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
    await waitFor(() => expect(input).toHaveFocus())

    const describedBy = input.getAttribute('aria-describedby')?.split(/\s+/) ?? []
    const describedText = describedBy.map((id) => document.getElementById(id)?.textContent).join(' ')

    expect(describedText).toContain('PDF only, up to 50 MB')
    expect(describedText).toContain('Choose a PDF file.')
    expect(input.closest('[aria-disabled]')).toHaveClass('focus-within:ring-2')
  })

  it('replaces the current file in single mode and validates without the replaced file', () => {
    const current = new File(['current'], 'current.pdf', { type: 'application/pdf' })
    const replacement = new File(['replacement'], 'replacement.pdf', { type: 'application/pdf' })
    const validateFiles = vi.fn<FileUploadValidator>((selectedFiles) => ({ validFiles: selectedFiles, errors: [] }))

    render(<UploadModeHarness initialFiles={[current]} multiple={false} validateFiles={validateFiles} />)

    const input = screen.getByLabelText('Browse PDF')
    expect(input).not.toHaveAttribute('multiple')
    fireEvent.change(input, { target: { files: [replacement] } })

    expect(validateFiles).toHaveBeenCalledWith([replacement], [])
    expect(screen.queryByText('current.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('replacement.pdf')).toBeInTheDocument()
  })

  it('appends consecutive batches and removes only the chosen file in multiple mode', () => {
    const first = new File(['first'], 'first.pdf', { type: 'application/pdf' })
    const second = new File(['second'], 'second.pdf', { type: 'application/pdf' })
    const third = new File(['third'], 'third.pdf', { type: 'application/pdf' })
    const validateFiles = vi.fn<FileUploadValidator>((selectedFiles) => ({ validFiles: selectedFiles, errors: [] }))

    render(<UploadModeHarness multiple validateFiles={validateFiles} />)

    const input = screen.getByLabelText('Browse PDF')
    expect(input).toHaveAttribute('multiple')
    fireEvent.change(input, { target: { files: [first, second] } })
    fireEvent.change(input, { target: { files: [third] } })

    expect(validateFiles).toHaveBeenNthCalledWith(1, [first, second], [])
    expect(validateFiles).toHaveBeenNthCalledWith(2, [third], [first, second])
    expect(screen.getByText('first.pdf')).toBeInTheDocument()
    expect(screen.getByText('second.pdf')).toBeInTheDocument()
    expect(screen.getByText('third.pdf')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove second.pdf' }))

    expect(screen.getByText('first.pdf')).toBeInTheDocument()
    expect(screen.queryByText('second.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('third.pdf')).toBeInTheDocument()
  })
})

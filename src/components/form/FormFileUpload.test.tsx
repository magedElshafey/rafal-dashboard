import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as yup from 'yup'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormFileUpload } from './FormFileUpload'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

type UploadFormValues = {
  file: File | null
}

function renderUploadForm() {
  const onSubmit = vi.fn()

  const result = render(
    <FormWrapper<UploadFormValues>
      defaultValues={{ file: null }}
      schema={yup.object({
        file: yup.mixed<File>().required('File is required').default(null),
      })}
      onSubmit={onSubmit}
    >
      <FormFileUpload name="file" label="Attachment" accept="application/pdf" />
      <button type="submit">Submit</button>
    </FormWrapper>
  )

  return { ...result, onSubmit }
}

describe('FormFileUpload', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('clears the required validation message after selecting a valid file', async () => {
    const user = userEvent.setup()
    const { container } = renderUploadForm()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('File is required')).toBeInTheDocument()

    const input = container.querySelector('input[type="file"]')
    expect(input).toBeInstanceOf(HTMLInputElement)

    await user.upload(input as HTMLInputElement, new File(['pdf'], 'assignment.pdf', { type: 'application/pdf' }))

    await waitFor(() => {
      expect(screen.queryByText('File is required')).not.toBeInTheDocument()
    })
  })
})

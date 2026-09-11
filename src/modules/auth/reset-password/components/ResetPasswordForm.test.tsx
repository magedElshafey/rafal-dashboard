import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import type { ResetPasswordFormValues } from '@/modules/auth/forgot-password/types/forget-password.types'

import ResetPasswordForm from './ResetPasswordForm'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function ResetPasswordFormHarness() {
  const form = useForm<ResetPasswordFormValues>({
    defaultValues: { password: '', passwordConfirmation: '' },
  })

  return (
    <FormProvider {...form}>
      <ResetPasswordForm isLoading={false} />
    </FormProvider>
  )
}

describe('ResetPasswordForm', () => {
  it('renders accessible, bounded new-password inputs with appropriate autocomplete', () => {
    render(<ResetPasswordFormHarness />)

    const password = screen.getByLabelText('auth.fields.password')
    const confirmation = screen.getByLabelText('auth.fields.password_confirmation')

    for (const input of [password, confirmation]) {
      expect(input).toHaveAttribute('type', 'password')
      expect(input).toHaveAttribute('autocomplete', 'new-password')
      expect(input).toHaveAttribute('maxlength', '20')
      expect(input).toHaveAttribute('aria-required', 'true')
    }
  })
})

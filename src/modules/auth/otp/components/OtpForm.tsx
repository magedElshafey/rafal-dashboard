import { memo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { AuthSubmitButton } from '@/modules/auth/components/AuthSubmitButton'
import ResendTimer from '@/modules/auth/otp/components/ResendTimer'
import { OTP_LENGTH } from '@/modules/auth/otp/constants/otp.constants'
import { cn } from '@/lib/utils'

import type { OtpFormValues } from '@/modules/auth/otp/types/otp.types'

type OtpFormProps = {
  phone: string
  countryCode: string
  onResend: () => Promise<void> | void
  onChangePhone: () => void
  isLoading: boolean
  isResending?: boolean
}

const OTP_SLOTS = Array.from({ length: OTP_LENGTH }, (_, index) => index)

const OtpForm = memo(function OtpForm({ onResend, isLoading, isResending = false }: OtpFormProps) {
  const { t } = useTranslation()

  const {
    control,
    formState: { errors, isValid },
  } = useFormContext<OtpFormValues>()

  return (
    <div className="space-y-6">
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <div className="space-y-2">
            <InputOTP
              maxLength={OTP_LENGTH}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              containerClassName="justify-center"
              aria-label={t('auth.otp.code_input_label')}
            >
              <InputOTPGroup dir="ltr" className="gap-3">
                {OTP_SLOTS.map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className={cn(
                      'size-12 rounded-xl border border-border-default bg-surface-card',
                      'text-xl font-semibold text-content-primary shadow-none',

                      // Override shadcn first / last slot styles
                      'first:rounded-l-2xl last:rounded-r-2xl',
                      'first:border-l',

                      'transition-[border-color,box-shadow] duration-200',
                      'data-[active=true]:border-brand-500',
                      'data-[active=true]:ring-4 data-[active=true]:ring-brand-100',

                      errors.code &&
                        'border-error-500 data-[active=true]:border-error-500 data-[active=true]:ring-error-50'
                    )}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {errors.code && <FormMessage>{errors.code.message}</FormMessage>}
          </div>
        )}
      />

      <Separator className="bg-border-default" />

      <ResendTimer onResend={onResend} isLoading={isResending} />

      <AuthSubmitButton
        className="min-h-13 w-full rounded-[10px] px-4 py-2"
        isLoading={isLoading}
        disabled={!isValid || isLoading}
      >
        {t('auth.otp.confirm')}
      </AuthSubmitButton>
    </div>
  )
})

export default OtpForm

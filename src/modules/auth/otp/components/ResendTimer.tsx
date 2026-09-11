import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { OTP_RESEND_SECONDS } from '@/modules/auth/otp/constants/otp.constants'

type ResendTimerProps = {
  onResend: () => Promise<void> | void
  isLoading?: boolean
}

const ResendTimer = memo(function ResendTimer({ onResend, isLoading = false }: ResendTimerProps) {
  const { t } = useTranslation()
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS)

  const canResend = seconds === 0 && !isLoading

  useEffect(() => {
    if (seconds === 0) return

    const timerId = window.setInterval(() => {
      setSeconds((currentSeconds) => Math.max(currentSeconds - 1, 0))
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [seconds])

  const handleResend = useCallback(async () => {
    if (!canResend) return

    await onResend()
    setSeconds(OTP_RESEND_SECONDS)
  }, [canResend, onResend])

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-neutral-900">
      <span>{t('auth.otp.did_not_receive_code')}</span>

      <Button
        type="button"
        variant="link"
        disabled={!canResend}
        onClick={handleResend}
        className="h-auto px-1 py-0 text-sm font-medium text-brand-500 disabled:pointer-events-none disabled:text-black-300"
      >
        {canResend ? t('auth.otp.resend') : t('auth.otp.resend_countdown', { seconds })}
      </Button>
    </div>
  )
})

export default ResendTimer

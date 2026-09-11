import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PencilLine } from 'lucide-react'

import { Button } from '@/components/ui/button'

type OtpPhoneBadgeProps = {
  phone: string
  countryCode: string
  onChangePhone: () => void
}

function maskPhone(phone: string) {
  if (phone.length <= 4) return phone

  const visibleStart = phone.slice(0, 3)
  const visibleEnd = phone.slice(-2)

  return `${visibleStart}*****${visibleEnd}`
}

export const OtpPhoneBadge = memo(function OtpPhoneBadge({ phone, countryCode, onChangePhone }: OtpPhoneBadgeProps) {
  const { t } = useTranslation()

  return (
    <div className="flex w-full items-center justify-between rounded-xl bg-black-50 px-3 py-3">
      <p className="text-sm font-medium text-neutral-700">
        {countryCode} {maskPhone(phone)}
      </p>

      <Button
        type="button"
        variant="ghost"
        onClick={onChangePhone}
        className="h-auto gap-1 px-1 py-0 text-sm font-medium text-brand-700 hover:bg-transparent hover:text-brand-800"
      >
        <PencilLine className="size-4" aria-hidden />
        {t('auth.otp.change_phone')}
      </Button>
    </div>
  )
})

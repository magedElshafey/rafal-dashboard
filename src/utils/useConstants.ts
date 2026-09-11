import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const useConstants = () => {
  const { t } = useTranslation()
  const activenessStatusOptions = useMemo(
    () => [
      { label: t('status.disabled'), value: 'Disabled' },
      { label: t('status.active'), value: 'Active' },
    ],
    [t]
  )

  return { activenessStatusOptions }
}

export default useConstants

import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

import type { LoginFormValues } from '@/modules/auth/login/types/login.types'
import { Routes } from '@/routes/routes'
import { useAuth } from '@/store/auth'
import { handleErrorFields } from '@/utils/error/errorHandler'

const LOGIN_DEFAULT_VALUES: LoginFormValues = {
  phone: '',
  password: '',
  rememberMe: false,
  countryCode: '+20',
}

const useLoginActions = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuth((state) => state.login)
  const defaultValues = useMemo<LoginFormValues>(() => LOGIN_DEFAULT_VALUES, [])

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      try {
        await login({
          phone: values.phone,
          password: values.password,
          rememberMe: values.rememberMe,
          countryCode: values.countryCode,
        })
        navigate(Routes.dashboard, { replace: true })
      } catch (error) {
        const errorMessage = isAxiosError(error)
          ? handleErrorFields((error.response?.data as { errors?: Record<string, unknown> })?.errors ?? {})
          : null
        toast.error(errorMessage || t('auth.login.server_error'))
      }
    },
    [login, navigate, t]
  )

  return { defaultValues, onSubmit }
}

export default useLoginActions

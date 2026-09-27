import { useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { LoginFormValues } from '@/modules/auth/login/types/login.types'
import { Routes } from '@/routes/routes'
import { useAuth } from '@/store/auth'

const LOGIN_DEFAULT_VALUES: LoginFormValues = {
  email: '',
  password: '',
}

const useLoginActions = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuth((state) => state.login)
  const defaultValues = useMemo<LoginFormValues>(() => LOGIN_DEFAULT_VALUES, [])
  const loginPending = useRef(false)

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      if (loginPending.current) return
      loginPending.current = true

      try {
        await login({
          email: values.email,
          password: values.password,
        })
        navigate(Routes.dashboard, { replace: true })
      } catch {
        toast.error(t('auth.login.server_error'))
      } finally {
        loginPending.current = false
      }
    },
    [login, navigate, t]
  )

  return { defaultValues, onSubmit }
}

export default useLoginActions

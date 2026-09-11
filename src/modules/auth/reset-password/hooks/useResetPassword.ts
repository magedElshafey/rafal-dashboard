import { useMutation } from '@tanstack/react-query'

import type { AuthPortal } from '@/modules/auth/types/auth.types'
import type { ResetPasswordPayload } from '@/modules/auth/forgot-password/types/forget-password.types'
import { resetPassword } from '@/modules/auth/reset-password/services/reset-password.services'

type ResetPasswordVariables = {
  portal: AuthPortal
  payload: ResetPasswordPayload
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ portal, payload }: ResetPasswordVariables) => {
      return resetPassword(portal, payload)
    },
  })
}

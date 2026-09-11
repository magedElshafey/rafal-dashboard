import { useMutation } from '@tanstack/react-query'

import type { AuthPortal } from '@/modules/auth/types/auth.types'
import type { ForgotPasswordPayload } from '@/modules/auth/forgot-password/types/forget-password.types'
import { requestForgotPasswordCode } from '@/modules/auth/forgot-password/service/forgot-password.services'

type ForgotPasswordMutationVariables = {
  portal: AuthPortal
  payload: ForgotPasswordPayload
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: ({ portal, payload }: ForgotPasswordMutationVariables) => {
      return requestForgotPasswordCode(portal, payload)
    },
  })
}

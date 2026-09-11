import type { ReactNode } from 'react'

import { RequireOtpFlowStep } from '@/modules/auth/guards/RequireOtpFlowStep'

type RequireResetPasswordFlowDataProps = {
  children: ReactNode
}

export function RequireResetPasswordFlowData({ children }: RequireResetPasswordFlowDataProps) {
  return <RequireOtpFlowStep requireOtp>{children}</RequireOtpFlowStep>
}

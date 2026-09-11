import type { ReactNode } from 'react'

import { RequireOtpFlowStep } from '@/modules/auth/guards/RequireOtpFlowStep'

type RequireOtpFlowDataProps = {
  children: ReactNode
}

export function RequireOtpFlowData({ children }: RequireOtpFlowDataProps) {
  return <RequireOtpFlowStep>{children}</RequireOtpFlowStep>
}

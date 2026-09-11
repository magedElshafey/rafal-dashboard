import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { getPortalByPathname } from '@/config/auth.helpers'
import { buildPortalPath } from '@/components/core/portal-link/utils/portal-path.helpers'
import { useOtpFlow } from '@/store/otp-flow'

type RequireOtpFlowStepProps = {
  children: ReactNode
  requireOtp?: boolean
}

const DEFAULT_FORGOT_PASSWORD_PATH = '/user/forget-password'

export function RequireOtpFlowStep({ children, requireOtp = false }: RequireOtpFlowStepProps) {
  const location = useLocation()

  const phone = useOtpFlow((state) => state.phone)
  const countryCode = useOtpFlow((state) => state.countryCode)
  const resetToken = useOtpFlow((state) => state.resetToken)
  const storedPortal = useOtpFlow((state) => state.portal)

  const currentPortal = getPortalByPathname(location.pathname)
  const portal = storedPortal ?? currentPortal

  const forgotPasswordPath = portal ? buildPortalPath('/forget-password', { portal }) : DEFAULT_FORGOT_PASSWORD_PATH

  if (!phone || !countryCode || !portal) {
    return <Navigate to={forgotPasswordPath} replace />
  }

  if (requireOtp && !resetToken) {
    return <Navigate to={buildPortalPath('/reset-password-verifications', { portal })} replace />
  }

  return children
}

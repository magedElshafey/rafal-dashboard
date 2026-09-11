import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AuthPortal } from '@/modules/auth/types/auth.types'

type OtpFlowState = {
  phone: string | null
  countryCode: string | null
  portal: AuthPortal | null
  resetToken: string | null

  setResetFlow: (data: { phone: string; countryCode: string; portal: AuthPortal }) => void

  setResetToken: (resetToken: string) => void
  clear: () => void
}

const emptyOtpFlowState = {
  phone: null,
  countryCode: null,
  portal: null,
  resetToken: null,
}

export const useOtpFlow = create<OtpFlowState>()(
  persist(
    (set) => ({
      ...emptyOtpFlowState,

      setResetFlow(data) {
        set({
          phone: data.phone,
          countryCode: data.countryCode,
          portal: data.portal,
          resetToken: null,
        })
      },

      setResetToken(resetToken) {
        set({ resetToken })
      },

      clear() {
        set(emptyOtpFlowState)
      },
    }),
    {
      name: 'otp-flow',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

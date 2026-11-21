export type AffiliateStatus = 'active' | 'suspended'

export type Affiliate = {
  id: number
  name: string
  mobile: string
  email: string
  platform: string
  username: string
  code: string
  status: AffiliateStatus
  createdAt: string
  updatedAt: string
}

export type AffiliateFilters = {
  search: string
  status: AffiliateStatus | null
}

export type AffiliateFormValues = {
  name: string
  mobile: string
  email: string
  platform: string
  username: string
  code: string
}

export type CreateAffiliatePayload = AffiliateFormValues

export type AffiliateProfileFormValues = Omit<AffiliateFormValues, 'code'>
export type UpdateAffiliatePayload = Partial<AffiliateProfileFormValues>

export type AffiliateAuditAction =
  'profile_updated' | 'status_suspended' | 'status_reactivated' | 'password_reset_requested'

export type AffiliateAuditEvent = {
  id: string
  affiliateId: number
  action: AffiliateAuditAction
  actor: { type: 'mock_staff'; id: 'development-staff' }
  previousState: Record<string, unknown> | null
  newState: Record<string, unknown> | null
  createdAt: string
}

export type AffiliatePasswordReset = {
  affiliateId: number
  deliveryStatus: 'queued'
  channel: 'sms'
  requiresPasswordChange: true
  requestedAt: string
}

export type AffiliateSettings = {
  programEnabled: boolean
  applicationsEnabled: boolean
  customerDiscountPercentage: number
  affiliateCommissionPercentage: number
  minimumPayoutAmount: string
  termsPageReference: string
  version: number
  updatedAt: string
}

export type AffiliateSettingsFormValues = Omit<AffiliateSettings, 'version' | 'updatedAt'>
export type UpdateAffiliateSettingsPayload = { version: number } & Partial<AffiliateSettingsFormValues>

export type AffiliateCodeSuggestion = {
  code: string
  reserved: false
}

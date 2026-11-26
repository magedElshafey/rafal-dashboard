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
  source?: string | null
  applicationId?: number | null
  lastLoginAt?: string | null
  termsAcceptedAt?: string | null
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

export type AffiliatePasswordReset = { sms_sent: boolean; sms_message: string | null }

export type AffiliateSettings = {
  programEnabled: boolean
  applicationsEnabled: boolean
  customerDiscountPercentage: number
  affiliateCommissionPercentage: number
  minimumPayoutAmount: string
  termsPageId: number | null
}
export type AffiliateSettingsFormValues = AffiliateSettings
export type UpdateAffiliateSettingsPayload = AffiliateSettingsFormValues
export type AffiliateCodeSuggestion = { code: string }
export type AffiliateListItem = Pick<
  Affiliate,
  'id' | 'name' | 'mobile' | 'email' | 'code' | 'status' | 'createdAt'
> & {
  source: string
  ordersCount: number
  pending: string
  approvedUnpaid: string
  paid: string
}

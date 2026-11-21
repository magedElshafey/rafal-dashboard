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

export type AffiliateCodeSuggestion = {
  code: string
  reserved: false
}

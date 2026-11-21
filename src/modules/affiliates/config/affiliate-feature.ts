import env from '@/config/env'

export const affiliateMockConfig = {
  baseUrl: env.AFFILIATE_MOCK_API_BASE_URL?.trim() ?? '',
  token: env.AFFILIATE_MOCK_TOKEN?.trim() ?? '',
}

export const isAffiliateFeatureEnabled =
  import.meta.env.DEV && Boolean(affiliateMockConfig.baseUrl && affiliateMockConfig.token)

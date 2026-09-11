type FormatPhoneNumberParams = {
  country_code?: string | null
  phone?: string | null
}

export function formatPhoneNumber({ country_code, phone }: FormatPhoneNumberParams): string {
  const normalizedCountryCode = country_code?.trim().replace(/^\+/, '')
  const normalizedPhone = phone?.trim().replace(/\s+/g, '')

  if (!normalizedCountryCode) return normalizedPhone ?? ''
  if (!normalizedPhone) return `+${normalizedCountryCode}`

  return `+${normalizedCountryCode}${normalizedPhone}`
}

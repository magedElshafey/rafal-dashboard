export const GENERIC_PHONE_PATTERN = /^\d{6,20}$/

export function normalizePhoneForApi(phone: string): string {
  return phone.trim().replace(/^0+/, '')
}

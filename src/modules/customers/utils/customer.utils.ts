type CustomerIdentity = {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
}

function nonEmpty(value: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function getCustomerDisplayName(customer: CustomerIdentity, fallback: string): string {
  const name = nonEmpty(customer.name)
  if (name) return name

  const fullName = [nonEmpty(customer.firstName), nonEmpty(customer.lastName)].filter(Boolean).join(' ')
  if (fullName) return fullName

  return nonEmpty(customer.email) ?? nonEmpty(customer.phone) ?? fallback
}

export function getReadableStatus(status: string): string {
  const normalized = status.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '—'
}

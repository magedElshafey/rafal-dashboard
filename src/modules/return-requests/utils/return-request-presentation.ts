import type { TFunction } from 'i18next'

export function returnRequestIdentityLabel(name: string, email: string, unavailable: string) {
  return name.trim() || email.trim() || unavailable
}

export function humanizeReturnRequestValue(value: string) {
  return value.replace(/[_-]+/g, ' ').trim()
}

export function isReturnRequestDecided(status: string | undefined) {
  return status === 'approved' || status === 'rejected'
}

export function returnRequestStatusLabel(value: string, t: TFunction) {
  if (value === 'pending' || value === 'approved' || value === 'rejected') return t(`returnRequests.status.${value}`)
  return humanizeReturnRequestValue(value)
}

export function returnRequestReasonLabel(reason: string, backendLabel: string, t: TFunction) {
  if (reason === 'damaged') return t('returnRequests.reason.damaged')
  return backendLabel.trim() || humanizeReturnRequestValue(reason)
}

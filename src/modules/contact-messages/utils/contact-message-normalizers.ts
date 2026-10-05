import type { ContactMessage, RawContactMessage } from '../types/contact-message.types'

// Called only with schema-validated DTOs at the API boundary.
export function normalizeContactMessage(raw: RawContactMessage): ContactMessage {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    subject: raw.subject,
    message: raw.message,
    status: raw.status,
    statusLabel: raw.status_label,
    user: raw.user
      ? { id: raw.user.id, firstName: raw.user.first_name, lastName: raw.user.last_name, email: raw.user.email }
      : null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

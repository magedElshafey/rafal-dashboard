import { Bell, Mail, MessageCircle, Send, type LucideIcon } from 'lucide-react'

const NOTIFICATION_CHANNEL_ICONS: Record<string, LucideIcon> = {
  in_app: Bell,
  email: Mail,
  sms: MessageCircle,
  whatsapp: Send,
}

export function getNotificationChannelIcon(value: string): LucideIcon {
  return NOTIFICATION_CHANNEL_ICONS[value] ?? Bell
}

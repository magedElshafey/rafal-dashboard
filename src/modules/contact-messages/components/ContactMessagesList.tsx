import { Eye, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Routes } from '@/routes/routes'
import type { ContactMessage } from '../types/contact-message.types'
import {
  ContactMessageAccount,
  ContactMessageDate,
  ContactMessageStatusBadge,
  ContactMessageText,
} from './ContactMessagePresentation'

const fields = ['name', 'contact', 'subject', 'message', 'status', 'account', 'createdAt', 'actions'] as const

export function ContactMessagesList({
  messages,
  onDelete,
  disabled,
}: {
  messages: ContactMessage[]
  onDelete: (message: ContactMessage) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const values = (message: ContactMessage) => [
    <ContactMessageText value={message.name} />,
    <div className="space-y-1 break-all">
      {message.email?.trim() ? (
        <p>
          <bdi>{message.email}</bdi>
        </p>
      ) : null}
      {message.phone?.trim() ? (
        <p>
          <bdi>{message.phone}</bdi>
        </p>
      ) : null}
      {!message.email?.trim() && !message.phone?.trim() ? t('contactMessages.unavailable') : null}
    </div>,
    <span className="block max-w-64 break-words">
      <ContactMessageText value={message.subject} />
    </span>,
    <p
      className="line-clamp-2 max-w-72 whitespace-pre-wrap break-words"
      dir="auto"
      title={message.message.trim() ? message.message : undefined}
    >
      <ContactMessageText value={message.message} />
    </p>,
    <ContactMessageStatusBadge message={message} />,
    <ContactMessageAccount user={message.user} />,
    <ContactMessageDate value={message.createdAt} />,
  ]
  const actions = (message: ContactMessage) => (
    <div className="flex gap-1">
      <Button asChild variant="ghost" size="icon">
        <Link
          to={Routes.contactMessageDetailPath(message.id)}
          aria-label={t('contactMessages.viewNamed', { id: message.id })}
        >
          <Eye aria-hidden="true" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label={t('contactMessages.deleteNamed', { id: message.id })}
        onClick={() => onDelete(message)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={fields.map((id) => ({ id, header: t(`contactMessages.fields.${id}`) }))}>
          {messages.map((message) => (
            <ResponsiveDataTableRow key={message.id}>
              {values(message).map((value, index) => (
                <ResponsiveDataTableCell className="whitespace-normal" key={fields[index]}>
                  {value}
                </ResponsiveDataTableCell>
              ))}
              <ResponsiveDataTableCell>{actions(message)}</ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {messages.map((message) => (
          <ResponsiveDataMobileCard
            key={message.id}
            title={<ContactMessageText value={message.name} />}
            actions={actions(message)}
            facts={values(message)
              .slice(1)
              .map((value, index) => (
                <ResponsiveDataFact key={fields[index + 1]} label={t(`contactMessages.fields.${fields[index + 1]}`)}>
                  {value}
                </ResponsiveDataFact>
              ))}
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
export function ContactMessagesListSkeleton() {
  const { t } = useTranslation()
  return (
    <div aria-hidden="true">
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={fields.map((id) => ({ id, header: t(`contactMessages.fields.${id}`) }))}>
          {Array.from({ length: 5 }, (_, row) => (
            <ResponsiveDataTableRow key={row}>
              {fields.map((field) => (
                <ResponsiveDataTableCell key={field}>
                  <Skeleton className="h-10 w-24" />
                </ResponsiveDataTableCell>
              ))}
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {Array.from({ length: 3 }, (_, row) => (
          <Skeleton key={row} className="h-96 w-full" />
        ))}
      </ResponsiveDataMobileCards>
    </div>
  )
}

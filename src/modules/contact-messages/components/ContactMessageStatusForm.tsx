import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormSelect } from '@/components/form/FormSelect'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/utils/error/api-error.helpers'
import { useUpdateContactMessageStatus } from '../hooks/useContactMessages'
import { contactMessageWritableStatusSchema } from '../schemas/contact-message.schema'
import type { ContactMessage } from '../types/contact-message.types'

export function ContactMessageStatusForm({ message, disabled }: { message: ContactMessage; disabled: boolean }) {
  const { t } = useTranslation()
  const mutation = useUpdateContactMessageStatus(message.id)
  const lock = useRef(false)
  const options = contactMessageWritableStatusSchema.options
    .filter((value) => value !== message.status)
    .map((value) => ({ value, label: t(`contactMessages.status.${value}`) }))
  const schema = useMemo(
    () =>
      Yup.object({
        status: Yup.string()
          .oneOf(contactMessageWritableStatusSchema.options, t('contactMessages.chooseStatus'))
          .required(t('contactMessages.chooseStatus')),
      }),
    [t]
  )
  const pending = disabled || mutation.isPending
  return (
    <div className="space-y-3">
      <FormWrapper<{ status: string }>
        key={message.status}
        schema={schema}
        defaultValues={{ status: '' }}
        submissionDisabled={pending}
        onSubmit={async ({ status }) => {
          if (lock.current || pending || status === message.status) return
          const parsed = contactMessageWritableStatusSchema.safeParse(status)
          if (!parsed.success) return
          lock.current = true
          try {
            await mutation.mutateAsync(parsed.data)
          } catch {
            /* Feedback remains next to the form. */
          } finally {
            lock.current = false
          }
        }}
      >
        <FormSelect
          name="status"
          label={t('contactMessages.changeStatus')}
          placeholder={t('contactMessages.chooseStatus')}
          data={options}
          valueKey="value"
          labelKey="label"
          required
          disabled={pending}
          onChange={() => mutation.reset()}
        />
        <Button className="mt-3" type="submit" disabled={pending}>
          {t(mutation.isPending ? 'contactMessages.saving' : 'contactMessages.saveStatus')}
        </Button>
      </FormWrapper>
      {mutation.error ? (
        <p role="alert" className="text-sm text-destructive">
          {getApiErrorMessage(mutation.error, t('contactMessages.feedback.statusError'))}
        </p>
      ) : null}
    </div>
  )
}

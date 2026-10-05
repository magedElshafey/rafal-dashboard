import { useMemo, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormTextArea } from '@/components/form/FormTextArea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { useDecideReturnRequest } from '../hooks/useReturnRequests'
import type { ReturnRequest, ReturnRequestDecisionAction } from '../types/return-request.types'
import { returnRequestDecisionFeedback } from '../utils/return-request-errors'

type DecisionFormValues = { decisionNote: string }

export function ReturnRequestDecisionActions({
  request,
  refreshing = false,
}: {
  request: ReturnRequest
  refreshing?: boolean
}) {
  const { t } = useTranslation()
  const mutation = useDecideReturnRequest(request.id)
  const [action, setAction] = useState<ReturnRequestDecisionAction | null>(null)
  const lock = useRef(false)
  const pending = mutation.isPending || refreshing
  const schema = useMemo(
    () =>
      Yup.object({
        decisionNote:
          action === 'reject'
            ? Yup.string().trim().required(t('returnRequests.validation.decisionNoteRequired'))
            : Yup.string(),
      }),
    [action, t]
  )
  const feedback = mutation.error
    ? returnRequestDecisionFeedback(
        mutation.error,
        t(action === 'approve' ? 'returnRequests.feedback.approveError' : 'returnRequests.feedback.rejectError')
      )
    : null

  if (request.status !== 'pending') return null

  const open = (nextAction: ReturnRequestDecisionAction) => {
    mutation.reset()
    setAction(nextAction)
  }

  const submit = async (values: DecisionFormValues, methods: UseFormReturn<DecisionFormValues>) => {
    if (!action || pending || lock.current) return
    lock.current = true
    try {
      await mutation.mutateAsync({ action, decisionNote: values.decisionNote })
      methods.reset()
      setAction(null)
    } catch (error) {
      const nextFeedback = returnRequestDecisionFeedback(
        error,
        t(action === 'approve' ? 'returnRequests.feedback.approveError' : 'returnRequests.feedback.rejectError')
      )
      if (nextFeedback.decisionNoteError) {
        methods.setError('decisionNote', { type: 'server', message: nextFeedback.decisionNoteError })
      }
    } finally {
      lock.current = false
    }
  }

  const formId = `return-request-${request.id}-${action ?? 'decision'}`
  return (
    <>
      <Button disabled={pending} onClick={() => open('approve')}>
        {t('returnRequests.actions.approve')}
      </Button>
      <Button variant="destructive" disabled={pending} onClick={() => open('reject')}>
        {t('returnRequests.actions.reject')}
      </Button>
      <Dialog
        open={action !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !pending) setAction(null)
        }}
      >
        <DialogContent showCloseButton={false} dir={t('returnRequests.direction')}>
          <DialogTitle>
            {t(
              action === 'approve'
                ? 'returnRequests.actions.confirmApproval'
                : 'returnRequests.actions.confirmRejection'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              action === 'approve'
                ? 'returnRequests.actions.approveDescription'
                : 'returnRequests.actions.rejectDescription',
              { id: request.id }
            )}
          </DialogDescription>
          <FormWrapper<DecisionFormValues>
            key={action}
            schema={schema}
            defaultValues={{ decisionNote: '' }}
            formId={formId}
            submissionDisabled={pending}
            onSubmit={submit}
          >
            <FormTextArea
              name="decisionNote"
              label={t('returnRequests.fields.decisionNote')}
              placeholder={t(
                action === 'reject'
                  ? 'returnRequests.actions.requiredDecisionNote'
                  : 'returnRequests.actions.optionalDecisionNote'
              )}
              required={action === 'reject'}
              disabled={pending}
              autoFocus
              onChange={() => mutation.reset()}
            />
          </FormWrapper>
          {feedback ? (
            <p role="alert" className="text-sm text-destructive">
              {feedback.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setAction(null)}>
              {t('returnRequests.actions.cancel')}
            </Button>
            <Button
              type="submit"
              form={formId}
              variant={action === 'reject' ? 'destructive' : 'default'}
              disabled={pending}
            >
              {t(
                pending
                  ? 'returnRequests.actions.submitting'
                  : action === 'approve'
                    ? 'returnRequests.actions.confirmApproval'
                    : 'returnRequests.actions.confirmRejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

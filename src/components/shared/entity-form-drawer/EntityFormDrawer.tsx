import { LoaderCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import type { EntityFormDrawerMode, EntityFormDrawerProps } from './entityFormDrawer.types'
import { Skeleton } from '@/components/ui/skeleton'

const EntityFormDrawerSkeleton = () => {
  const { t } = useTranslation()

  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{t('queryState.loading')}</span>
      <div aria-hidden="true" className="space-y-5">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EntityFormDrawer<TMode extends EntityFormDrawerMode>({
  open,
  mode,
  onOpenChange,
  titles,
  descriptions,
  submitLabels,
  createAnotherLabel,
  cancelLabel,
  closeLabel,
  children,
  footerStatus,
  formId,
  onSubmit,
  onSubmitAndCreateAnother,
  onCancel,
  isLoading = false,
  isSubmitting = false,
  isSubmitDisabled = false,
  preventClose,
  loadingContent,
  errorContent,
  headerActions,
  footer,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}: EntityFormDrawerProps<TMode>) {
  const isClosePrevented = preventClose ?? isSubmitting
  const shouldDisableSubmit = isLoading || isSubmitting || isSubmitDisabled
  const shouldShowCreateAnother = mode === 'create' && createAnotherLabel !== undefined

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isClosePrevented) {
      return
    }

    onOpenChange(nextOpen)
  }

  const handleClose = () => {
    if (isClosePrevented) {
      return
    }

    onOpenChange(false)
  }

  const handleCancel = () => {
    if (isClosePrevented) {
      return
    }

    onCancel?.()
    onOpenChange(false)
  }

  const handlePrimaryAction = () => {
    if (formId || shouldDisableSubmit) {
      return
    }

    onSubmit?.()
  }

  const handleCreateAnotherAction = () => {
    if (formId || shouldDisableSubmit) {
      return
    }

    onSubmitAndCreateAnother?.()
  }

  const drawerContent = errorContent ?? (isLoading ? (loadingContent ?? <EntityFormDrawerSkeleton />) : children)

  const description = descriptions?.[mode]

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (isClosePrevented) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (isClosePrevented) {
            event.preventDefault()
          }
        }}
        className={cn(
          'w-full gap-0 overflow-hidden border-s border-border bg-surface p-0',
          'sm:max-w-120 lg:max-w-140 sm:rounded-s-3xl',
          className
        )}
      >
        <SheetHeader
          className={cn(
            'flex-row items-start justify-between gap-4 border-b border-border-subtle text-neutral-800 bg-black-50 p-6 text-start',
            headerClassName
          )}
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <SheetTitle className="text-lg font-semibold leading-7 ">{titles[mode]}</SheetTitle>

            {description && <SheetDescription className="text-sm leading-5">{description}</SheetDescription>}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {headerActions}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isClosePrevented}
              aria-label={closeLabel}
              onClick={handleClose}
              className="size-9 rounded-lg"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </SheetHeader>

        <div
          aria-busy={isLoading || isSubmitting}
          className={cn('min-h-0 flex-1 overflow-y-auto p-6 bg-surface-subtle', bodyClassName)}
        >
          {drawerContent}
        </div>
        {footerStatus}
        {footer !== null && (
          <SheetFooter
            className={cn(
              'grid shrink-0 grid-cols-1 gap-3 border-t border-border bg-surface p-6 sm:grid-cols-2',
              shouldShowCreateAnother && 'sm:grid-cols-3',
              footerClassName
            )}
          >
            {footer === undefined ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isClosePrevented}
                  onClick={handleCancel}
                  className="h-11 rounded-lg border-border text-foreground"
                >
                  {cancelLabel}
                </Button>

                {shouldShowCreateAnother ? (
                  <Button
                    type={formId ? 'submit' : 'button'}
                    form={formId}
                    data-submit-intent="create-another"
                    variant="outline"
                    disabled={shouldDisableSubmit}
                    aria-disabled={shouldDisableSubmit}
                    onClick={handleCreateAnotherAction}
                    className="h-11 rounded-lg border-border text-foreground"
                  >
                    {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                    {createAnotherLabel}
                  </Button>
                ) : null}

                <Button
                  type={formId ? 'submit' : 'button'}
                  form={formId}
                  data-submit-intent={mode}
                  disabled={shouldDisableSubmit}
                  aria-disabled={shouldDisableSubmit}
                  onClick={handlePrimaryAction}
                  className="h-11 rounded-lg bg-brand-500"
                >
                  {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}

                  {submitLabels[mode]}
                </Button>
              </>
            ) : (
              footer
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default EntityFormDrawer

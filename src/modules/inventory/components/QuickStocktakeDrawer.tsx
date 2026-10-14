import { useEffect, useMemo, useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form'
import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStocktakeReview } from '@/modules/inventory/hooks/useStocktakeReview'
import type { InventoryStock } from '@/modules/inventory/types/inventory.types'
import { createProductVariantStockSchema } from '@/modules/products/schemas/product-variant-stock.schema'
import type { VariantWarehouseStockFormValues } from '@/modules/products/types/product-variant.types'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'

const FORM_ID = 'inventory-stocktake-form'

function StocktakeVariance({ recorded, counted }: { recorded: number; counted: number | null }) {
  const { t, i18n } = useTranslation()
  const difference = counted === null ? null : counted - recorded
  const label =
    difference === null ? 'enterCount' : difference < 0 ? 'shortage' : difference > 0 ? 'surplus' : 'unchanged'
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <p className="text-sm font-medium">{t('inventory.stocktake.variance')}</p>
      <Badge variant={difference === null || difference === 0 ? 'outline' : difference < 0 ? 'warning' : 'secondary'}>
        {t(`inventory.stocktake.${label}`, {
          count: difference === null ? 0 : Math.abs(difference),
          quantity: difference === null ? '' : new Intl.NumberFormat(i18n.language).format(Math.abs(difference)),
        })}
      </Badge>
    </div>
  )
}

function StocktakeFields({
  baseline,
  disabled,
  reviewQuantity,
  busy,
  onCountChange,
}: {
  baseline: number
  disabled: boolean
  reviewQuantity: number | null
  busy: boolean
  onCountChange: () => void
}) {
  const { t } = useTranslation()
  const { setFocus } = useFormContext<VariantWarehouseStockFormValues>()
  const value: unknown = useWatch({ name: 'quantity' })
  const counted =
    (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) >= 0
      ? Number(value)
      : null
  useEffect(() => {
    if (reviewQuantity !== null || busy) return
    // Let the dialog settle after the focused review heading is removed.
    const frame = requestAnimationFrame(() => setFocus('quantity'))
    return () => cancelAnimationFrame(frame)
  }, [reviewQuantity, busy, setFocus])
  return (
    <div className="space-y-4">
      <FormInput
        name="quantity"
        type="number"
        inputMode="numeric"
        min={0}
        max={Number.MAX_SAFE_INTEGER}
        step={1}
        dir="ltr"
        label={t('inventory.stocktake.physicalCount')}
        description={t('inventory.stocktake.countHelp')}
        onChange={onCountChange}
        required
        disabled={disabled}
      />
      <StocktakeVariance recorded={baseline} counted={counted} />
    </div>
  )
}

export function QuickStocktakeDrawer({ stock, onClose }: { stock: InventoryStock; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const workflow = useStocktakeReview(stock, onClose)
  const reviewTitle = useRef<HTMLHeadingElement>(null)
  const numbers = new Intl.NumberFormat(i18n.language)
  const schema = useMemo(
    () =>
      createProductVariantStockSchema({
        required: t('products.validation.required'),
        validNumber: t('products.validation.validNumber'),
        integer: t('products.validation.integer'),
        nonNegative: t('products.validation.nonNegative'),
      }),
    [t]
  )
  useEffect(() => {
    if (workflow.reviewQuantity !== null) reviewTitle.current?.focus()
  }, [workflow.reviewQuantity])

  return (
    <EntityFormDrawer
      open
      mode="edit"
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      titles={{ edit: t('inventory.stocktake.title') }}
      descriptions={{ edit: t('inventory.stocktake.description') }}
      submitLabels={{ edit: workflow.busy ? t('inventory.stocktake.checking') : t('inventory.stocktake.review') }}
      cancelLabel={t('products.actions.cancel')}
      closeLabel={t('inventory.stocktake.close')}
      formId={FORM_ID}
      isSubmitting={workflow.busy}
      preventClose={workflow.saving}
      className="h-dvh motion-reduce:animate-none motion-reduce:transition-none rtl:right-auto rtl:left-0 rtl:rounded-s-none rtl:sm:rounded-e-3xl rtl:data-[state=open]:slide-in-from-left rtl:data-[state=closed]:slide-out-to-left"
      footer={
        workflow.reviewQuantity !== null ? (
          <>
            <Button type="button" className="h-11" variant="outline" disabled={workflow.busy} onClick={workflow.edit}>
              {t('inventory.stocktake.editCount')}
            </Button>
            <Button type="button" className="h-11" disabled={workflow.busy} onClick={() => void workflow.confirm()}>
              {t(workflow.busy ? 'inventory.stocktake.saving' : 'inventory.stocktake.confirm')}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-5" dir={i18n.dir()}>
        <dl className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
          <ResponsiveDataFact label={t('inventory.fields.product')} className="sm:col-span-2">
            <bdi className="break-all">{getLocalizedProductName(stock.product.name, i18n.language)}</bdi>
          </ResponsiveDataFact>
          <ResponsiveDataFact label={t('inventory.fields.variantSku')}>
            <bdi dir="ltr" className="break-all">
              {stock.variant.sku}
            </bdi>
          </ResponsiveDataFact>
          <ResponsiveDataFact label={t('inventory.fields.warehouse')}>
            <bdi>{stock.warehouse.name}</bdi>
          </ResponsiveDataFact>
          <ResponsiveDataFact label={t('inventory.fields.quantity')}>
            <span className="text-2xl tabular-nums">{numbers.format(workflow.baseline)}</span>
          </ResponsiveDataFact>
        </dl>
        {workflow.notice ? (
          <p role="alert" className="rounded-lg border border-border bg-muted p-4 text-sm leading-6">
            {t(`inventory.stocktake.notices.${workflow.notice}`)}
          </p>
        ) : null}
        <FormWrapper<VariantWarehouseStockFormValues>
          schema={schema}
          formId={FORM_ID}
          defaultValues={{ warehouseId: stock.warehouse.id, quantity: null }}
          onSubmit={workflow.review}
          submissionDisabled={workflow.busy || workflow.reviewQuantity !== null}
        >
          <StocktakeFields
            baseline={workflow.baseline}
            disabled={workflow.busy || workflow.reviewQuantity !== null}
            reviewQuantity={workflow.reviewQuantity}
            busy={workflow.busy}
            onCountChange={workflow.clearNotice}
          />
        </FormWrapper>
        {workflow.reviewQuantity !== null ? (
          <section
            className="space-y-3 rounded-xl border border-primary/30 bg-surface p-4"
            aria-labelledby="stocktake-review-title"
          >
            <h3
              id="stocktake-review-title"
              ref={reviewTitle}
              tabIndex={-1}
              className="font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('inventory.stocktake.confirmTitle')}
            </h3>
            <p className="text-sm leading-6">
              {t('inventory.stocktake.replaceSummary', {
                recorded: numbers.format(workflow.baseline),
                counted: numbers.format(workflow.reviewQuantity),
              })}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">{t('inventory.stocktake.recheckHelp')}</p>
          </section>
        ) : null}
      </div>
    </EntityFormDrawer>
  )
}

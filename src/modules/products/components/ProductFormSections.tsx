import { useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormCheckbox, FormEditor, FormImageUploader, FormInput, FormSelect, FormSortOrder } from '@/components/form'
import { FormSwitch } from '@/components/form/FormSwitch'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/modules/categories/hooks/useCategories'
import { PRODUCT_IMAGE_MAX_SIZE } from '@/modules/products/schemas/product-create.schema'
import type { ProductFormValues } from '@/modules/products/types/product.types'

type ProductFormSectionsProps = {
  isSubmitting: boolean
  existingImages?: Array<{ id: number; url: string }>
  onDeleteExistingImage?: (imageId: number) => Promise<unknown>
  deletingExistingImageId?: number | null
}

function ProductFormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <DashboardCard className="space-y-5" padding="lg">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </DashboardCard>
  )
}

export function ProductFormSections({
  isSubmitting,
  existingImages = [],
  onDeleteExistingImage,
  deletingExistingImageId = null,
}: ProductFormSectionsProps) {
  const { t, i18n } = useTranslation()
  const { control, setValue } = useFormContext<ProductFormValues>()
  const isPersonalizable = useWatch({ control, name: 'isPersonalizable' })
  const categoriesQuery = useCategories()
  const categories = useMemo(
    () => categoriesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [categoriesQuery.data]
  )
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.name[language].trim() || category.name.ar.trim() || category.name.en.trim(),
  }))
  const hasCategoryError = categoriesQuery.isError || categoriesQuery.isFetchNextPageError

  const handlePersonalizableChange = (enabled: boolean) => {
    if (!enabled) {
      setValue('personalizationMaxLength', null, { shouldDirty: true, shouldValidate: true })
      setValue('personalizationFee', null, { shouldDirty: true, shouldValidate: true })
    }
  }

  return (
    <div className="space-y-5">
      <ProductFormSection
        title={t('products.create.sections.basic.title')}
        description={t('products.create.sections.basic.description')}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormSelect
            name="categoryId"
            label={t('products.create.fields.category')}
            placeholder={t('products.create.category.placeholder')}
            data={categoryOptions}
            valueKey="id"
            labelKey="label"
            deserializeValue={(value) => (value ? Number(value) : null)}
            disabled={isSubmitting}
            isLoading={categoriesQuery.isLoading}
            isFetchingNextPage={categoriesQuery.isFetchingNextPage}
            hasNextPage={categoriesQuery.hasNextPage}
            onLoadMore={categoriesQuery.fetchNextPage}
            isError={hasCategoryError}
            isRetrying={categoriesQuery.isFetching}
            onRetry={
              categoriesQuery.isFetchNextPageError ? categoriesQuery.fetchNextPage : () => categoriesQuery.refetch()
            }
            emptyMessage={t('products.create.category.empty')}
            loadingMessage={t('products.create.category.loading')}
            loadMoreMessage={t('products.create.category.loadMore')}
            errorMessage={t('products.create.category.error')}
            retryLabel={t('products.create.category.retry')}
            required
          />
          <FormInput
            name="sku"
            label={t('products.create.fields.sku')}
            dir="ltr"
            maxLength={255}
            disabled={isSubmitting}
            required
          />
          <FormInput
            name="name.ar"
            label={t('products.create.fields.nameAr')}
            dir="rtl"
            maxLength={255}
            disabled={isSubmitting}
            required
          />
          <FormInput
            name="name.en"
            label={t('products.create.fields.nameEn')}
            dir="ltr"
            maxLength={255}
            disabled={isSubmitting}
          />
        </div>
      </ProductFormSection>

      <ProductFormSection
        title={t('products.create.sections.description.title')}
        description={t('products.create.sections.description.description')}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormEditor
            name="description.ar"
            label={t('products.create.fields.descriptionAr')}
            dir="rtl"
            disabled={isSubmitting}
          />
          <FormEditor
            name="description.en"
            label={t('products.create.fields.descriptionEn')}
            dir="ltr"
            disabled={isSubmitting}
          />
        </div>
      </ProductFormSection>

      <ProductFormSection
        title={t('products.create.sections.pricing.title')}
        description={t('products.create.sections.pricing.description')}
      >
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <FormInput
            name="basePrice"
            label={t('products.create.fields.basePrice')}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            dir="ltr"
            disabled={isSubmitting}
            required
          />
          <FormInput
            name="discountPercentage"
            label={t('products.create.fields.discountPercentage')}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            dir="ltr"
            disabled={isSubmitting}
          />
          <FormInput
            name="discountEndAt"
            label={t('products.create.fields.discountEndAt')}
            type="datetime-local"
            dir="ltr"
            disabled={isSubmitting}
          />
        </div>
      </ProductFormSection>

      <ProductFormSection
        title={t('products.create.sections.personalization.title')}
        description={t('products.create.sections.personalization.description')}
      >
        <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="pt-3">
            <FormSwitch
              name="isPersonalizable"
              label={t('products.create.fields.isPersonalizable')}
              disabled={isSubmitting}
              onChange={handlePersonalizableChange}
            />
          </div>
          <FormInput
            name="personalizationMaxLength"
            label={t('products.create.fields.personalizationMaxLength')}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            dir="ltr"
            disabled={isSubmitting || !isPersonalizable}
            required={isPersonalizable}
          />
          <FormInput
            name="personalizationFee"
            label={t('products.create.fields.personalizationFee')}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            dir="ltr"
            disabled={isSubmitting || !isPersonalizable}
          />
        </div>
      </ProductFormSection>

      <ProductFormSection
        title={t('products.create.sections.images.title')}
        description={t('products.create.sections.images.description')}
      >
        {existingImages.length > 0 ? (
          <ProductExistingImages
            images={existingImages}
            onDelete={onDeleteExistingImage}
            deletingImageId={deletingExistingImageId}
          />
        ) : null}
        <FormImageUploader<ProductFormValues>
          name="images"
          label={t('products.create.fields.images')}
          mode="multiple"
          accept="image/*"
          maxFileSize={PRODUCT_IMAGE_MAX_SIZE}
          previewFit="contain"
          disabled={isSubmitting}
        />
      </ProductFormSection>

      <ProductFormSection
        title={t('products.create.sections.settings.title')}
        description={t('products.create.sections.settings.description')}
      >
        <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <FormCheckbox
            name="hidePriceOnPackaging"
            label={t('products.create.fields.hidePriceOnPackaging')}
            disabled={isSubmitting}
          />
          <FormCheckbox name="isNewArrival" label={t('products.create.fields.isNewArrival')} disabled={isSubmitting} />
          <FormCheckbox name="isActive" label={t('products.create.fields.isActive')} disabled={isSubmitting} />
          <FormSortOrder
            name="sortOrder"
            label={t('products.create.fields.sortOrder')}
            disabled={isSubmitting}
            required
          />
        </div>
      </ProductFormSection>
    </div>
  )
}

function ProductExistingImages({
  images,
  onDelete,
  deletingImageId,
}: {
  images: Array<{ id: number; url: string }>
  onDelete?: (imageId: number) => Promise<unknown>
  deletingImageId: number | null
}) {
  const { t } = useTranslation()
  const alertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [imageToDelete, setImageToDelete] = useState<number | null>(null)

  useEffect(() => {
    if (imageToDelete !== null) alertRef.current?.handleOpen(true)
  }, [imageToDelete])

  const handleDelete = async () => {
    if (imageToDelete === null || !onDelete || deletingImageId === imageToDelete || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await onDelete(imageToDelete)
      alertRef.current?.close()
      setImageToDelete(null)
    } catch {
      // Localized mutation feedback owns the error; keep the confirmation open for retry.
    } finally {
      deleteLockRef.current = false
    }
  }

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={t('products.edit.existingImages')}>
        {images.map((image) => {
          const label = t('products.edit.existingImageAlt', { id: image.id })
          const isDeleting = deletingImageId === image.id
          return (
            <li key={image.id} className="overflow-hidden rounded-xl border border-border bg-surface">
              <img src={image.url} alt={label} className="aspect-video size-full object-contain" />
              {onDelete ? (
                <div className="flex justify-end border-t border-border p-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isDeleting}
                    aria-label={t('products.actions.deleteImageNamed', { id: image.id })}
                    onClick={() => setImageToDelete(image.id)}
                  >
                    {isDeleting ? (
                      <LoaderCircle aria-hidden="true" className="animate-spin" />
                    ) : (
                      <Trash2 aria-hidden="true" />
                    )}
                    {t('products.actions.deleteImage')}
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      <DeleteAlert
        ref={alertRef}
        title={t('products.imageDelete.title')}
        body={t('products.imageDelete.description')}
        confirmLabel={t('products.actions.deleteImage')}
        cancelLabel={t('products.actions.cancel')}
        pendingLabel={t('products.actions.deletingImage')}
        isPending={deletingImageId === imageToDelete}
        onDelete={handleDelete}
        onCancel={() => setImageToDelete(null)}
      />
    </>
  )
}

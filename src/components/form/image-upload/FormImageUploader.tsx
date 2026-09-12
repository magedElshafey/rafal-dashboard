import type { FieldValues, Path } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'

import { FormField, FormItem, FormLabel } from '@/components/ui/form'

import { ImageUploader, type ImageUploaderProps } from './ImageUploader'
import { EMPTY_IMAGE_UPLOAD_VALUE, type ImageUploadValue } from './image-upload.types'

type FormImageUploaderProps<TValues extends FieldValues> = Omit<
  ImageUploaderProps,
  'files' | 'onFilesChange' | 'removedExistingIds' | 'onExistingRemove' | 'error' | 'label'
> & {
  name: Path<TValues>
  label?: string
}

export function FormImageUploader<TValues extends FieldValues>({
  name,
  label,
  required,
  ...props
}: FormImageUploaderProps<TValues>) {
  const { control } = useFormContext<TValues>()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = (field.value as ImageUploadValue | undefined) ?? EMPTY_IMAGE_UPLOAD_VALUE
        return (
          <FormItem>
            {label ? (
              <FormLabel>
                {label}
                {required ? (
                  <span aria-hidden="true" className="ms-1 text-destructive">
                    *
                  </span>
                ) : null}
              </FormLabel>
            ) : null}
            <ImageUploader
              {...props}
              ariaLabel={label}
              required={required}
              files={value.files}
              removedExistingIds={value.removedExistingIds}
              error={fieldState.error?.message}
              onFilesChange={(files) => {
                field.onChange({ ...value, files })
                field.onBlur()
              }}
              onExistingRemove={(image) => {
                field.onChange({
                  ...value,
                  removedExistingIds: [...value.removedExistingIds, image.id],
                })
                field.onBlur()
              }}
            />
          </FormItem>
        )
      }}
    />
  )
}

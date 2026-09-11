import type { FieldPathByValue, FieldValues } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'

import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { FileUploadPanel, type FileUploadPanelProps } from './FileUploadPannel'

type FileUploadPanelFieldProps<TFieldValues extends FieldValues> = Omit<
  FileUploadPanelProps,
  'files' | 'onFilesChange' | 'error'
> & {
  name: FieldPathByValue<TFieldValues, File[]>
}

export function FileUploadPanelField<TFieldValues extends FieldValues>({
  name,
  ...panelProps
}: FileUploadPanelFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const files = Array.isArray(field.value) ? (field.value as File[]) : []

        return (
          <FormItem>
            <FormControl>
              <FileUploadPanel
                {...panelProps}
                ref={field.ref}
                files={files}
                error={fieldState.error?.message}
                onBlur={field.onBlur}
                onFilesChange={(newFiles) => {
                  field.onChange(newFiles)
                }}
              />
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}

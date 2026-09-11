import type { FieldPathByValue, FieldValues } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'

import { FormControl, FormField, FormItem } from '@/components/ui/form'

import { FileUploadPanel, type FileUploadPanelProps } from './FileUploadPannel'

type SingleFileUploadPanelFieldProps<TFieldValues extends FieldValues> = Omit<
  FileUploadPanelProps,
  'files' | 'onFilesChange' | 'error' | 'multiple'
> & {
  name: FieldPathByValue<TFieldValues, File | null>
}

function isFile(value: unknown): value is File {
  return value instanceof File
}

export function SingleFileUploadPanelField<TFieldValues extends FieldValues>({
  name,
  ...panelProps
}: SingleFileUploadPanelFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedFile = isFile(field.value) ? field.value : null

        return (
          <FormItem>
            <FormControl>
              <FileUploadPanel
                {...panelProps}
                ref={field.ref}
                multiple={false}
                files={selectedFile ? [selectedFile] : []}
                error={fieldState.error?.message}
                onBlur={field.onBlur}
                onFilesChange={(files) => {
                  field.onChange(files[0] ?? null)
                }}
              />
            </FormControl>
          </FormItem>
        )
      }}
    />
  )
}

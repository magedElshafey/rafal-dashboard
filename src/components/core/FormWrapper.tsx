import { yupResolver } from '@hookform/resolvers/yup'
import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef } from 'react'
import {
  type Control,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  FormProvider,
  type Mode,
  type UseFormReturn,
  useForm,
  useFormState,
} from 'react-hook-form'
import type { AnyObjectSchema } from 'yup'

import { Form, FormValidationVisibilityProvider, type FormValidationVisibility } from '@/components/ui/form'

type FormSchema = AnyObjectSchema

interface FormWrapperProps<TFieldValues extends FieldValues> {
  schema?: FormSchema
  defaultValues: DefaultValues<TFieldValues>

  /**
   * Values used to reset the form when create/edit data changes.
   */
  resetValues?: DefaultValues<TFieldValues>

  /**
   * Limits resetValues hydration to once per logical record.
   */
  resetValuesKey?: string | number

  onSubmit: (data: TFieldValues, methods: UseFormReturn<TFieldValues>) => void | Promise<void>

  formId?: string
  className?: string
  validationMode?: Mode
  validationVisibility?: FormValidationVisibility
  submissionDisabled?: boolean
  onFormStateChange?: (state: { isDirty: boolean; isValid: boolean }) => void
}

interface IFormContext {
  errors: FieldErrors
}

type FormStateChangeHandler = (state: { isDirty: boolean; isValid: boolean }) => void

export const FormContext = createContext<IFormContext | undefined>(undefined)

export const useFormWrapperContext = () => {
  const context = useContext(FormContext)

  if (!context) {
    throw new Error('useFormWrapperContext must be used inside FormWrapper')
  }

  return context
}

function FormStateNotifier<TFieldValues extends FieldValues>({
  control,
  onChange,
}: {
  control: Control<TFieldValues>
  onChange: FormStateChangeHandler
}) {
  const { isDirty, isValid } = useFormState({ control })

  useEffect(() => {
    onChange({ isDirty, isValid })
  }, [isDirty, isValid, onChange])

  return null
}

function FormErrorsProvider<TFieldValues extends FieldValues>({
  control,
  children,
}: PropsWithChildren<{ control: Control<TFieldValues> }>) {
  const { errors } = useFormState({ control })
  const contextValue = useMemo<IFormContext>(() => ({ errors }), [errors])

  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
}

export const FormWrapper = <TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  resetValues,
  resetValuesKey,
  onSubmit,
  formId,
  className,
  validationMode = 'onSubmit',
  validationVisibility = 'always',
  submissionDisabled = false,
  onFormStateChange,
  children,
}: PropsWithChildren<FormWrapperProps<TFieldValues>>) => {
  const methods = useForm<TFieldValues>({
    // When supplied, Yup's optional-key output type is wider than RHF's generic resolver contract.
    // Runtime validation still returns this form's schema-validated TFieldValues.
    resolver: schema ? (yupResolver(schema) as never) : undefined,
    defaultValues,
    shouldFocusError: true,
    mode: validationMode,
    reValidateMode: 'onChange',
  })

  const { reset } = methods
  const lastResetValuesKeyRef = useRef<string | number | undefined>(undefined)

  useEffect(() => {
    if (!resetValues) {
      return
    }

    if (resetValuesKey !== undefined && lastResetValuesKeyRef.current === resetValuesKey) {
      return
    }

    reset(resetValues)
    lastResetValuesKeyRef.current = resetValuesKey
  }, [reset, resetValues, resetValuesKey])

  return (
    <FormValidationVisibilityProvider mode={validationVisibility}>
      <FormProvider {...methods}>
        <Form {...methods}>
          <form
            id={formId}
            noValidate
            className={className}
            onSubmit={
              submissionDisabled
                ? (event) => event.preventDefault()
                : methods.handleSubmit((data) => onSubmit(data, methods))
            }
          >
            {onFormStateChange && <FormStateNotifier control={methods.control} onChange={onFormStateChange} />}
            <FormErrorsProvider control={methods.control}>{children}</FormErrorsProvider>
          </form>
        </Form>
      </FormProvider>
    </FormValidationVisibilityProvider>
  )
}

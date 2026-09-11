export const authFormClassNames = {
  fieldLabels: "[&_[data-slot='label']]:font-medium [&_[data-slot='label']]:text-white",
  checkboxLabel: "[&_[data-slot='label']]:font-normal [&_[data-slot='label']]:text-white/80 text-sm",
  inputContainer: 'min-h-[52px] rounded-lg border-0 bg-auth-input px-3 py-2 3xl:py-3',
  input: 'text-start text-white placeholder:text-auth-placeholder',
  submitButton:
    'min-h-[52px] w-full rounded-lg bg-auth-primary  font-medium text-black-800 hover:bg-auth-primary-hover py-4',
  visitorButton:
    'min-h-[52px] w-full rounded-lg bg-auth-secondary-btn  font-medium text-auth-primary hover:bg-auth-input-hover hover:text-auth-primary-hover py-4',
  footerText: 'text-center text-sm text-white',
  footerLink: 'font-semibold text-auth-primary hover:text-auth-primary-hover focus-visible:underline',
} as const

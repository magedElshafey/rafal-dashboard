import { cn } from '@/lib/utils'
import type { TButtonProps } from './button'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

interface Props extends Omit<ComponentProps<'input'>, 'prefix' | 'suffix'> {
  slim?: boolean
  controlSize?: 'default' | 'compact'
  suffix?: ReactNode
  prefix?: ReactNode
  containerClassName?: string
}

const iconStyles = 'flex items-center justify-center px-2 text-red-700'

function Input({
  className,
  type,
  slim,
  controlSize = 'default',
  suffix,
  prefix,
  containerClassName,
  ...props
}: Props) {
  return (
    <div
      data-slot="input-container"
      className={cn(
        'flex h-14 items-center rounded-2xl border border-black-50 bg-black-50 px-2 py-4.5 transition-all',
        'hover:border-black-100',
        'focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/20',
        'has-[input[aria-invalid=true]]:border-error-500 has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-error-500/20',
        'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:border-black-100 has-[input:disabled]:bg-black-100',
        'has-[input:read-only]:border-black-100 has-[input:read-only]:bg-black-100 has-[input:read-only]:cursor-not-allowed',
        ' disabled:cursor-not-allowed',
        controlSize === 'compact' && 'h-12 rounded-xl py-3',
        suffix || prefix ? 'gap-2' : 'gap-0',
        containerClassName
      )}
    >
      {prefix && (
        <div className={cn(iconStyles, (prefix as ReactElement<TButtonProps>)?.props.type === 'button' && 'px-0')}>
          {prefix}
        </div>
      )}

      <input
        type={type}
        data-slot="input"
        className={cn(
          'w-full min-w-0 bg-transparent px-3 py-2 text-sm text-content-primary outline-none',
          'placeholder:text-black-400 placeholder:capitalize',
          'selection:bg-primary selection:text-white',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-content-secondary',
          'read-only:cursor-default read-only:text-content-secondary',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'aria-invalid:text-error-500',
          slim && 'rounded-s-none',
          className
        )}
        {...props}
      />

      {suffix && (
        <div className={cn(iconStyles, (suffix as ReactElement<TButtonProps>)?.props.type === 'button' && 'px-0')}>
          {suffix}
        </div>
      )}
    </div>
  )
}

export { Input }

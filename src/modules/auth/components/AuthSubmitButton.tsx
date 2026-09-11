import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { TButtonProps } from '@/components/ui/button'

interface AuthSubmitButtonProps extends TButtonProps {
  isLoading?: boolean
}

export const AuthSubmitButton = ({ children, isLoading, disabled, className, ...props }: AuthSubmitButtonProps) => {
  return (
    <Button className={className} type="submit" disabled={disabled || isLoading} {...props}>
      {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  )
}

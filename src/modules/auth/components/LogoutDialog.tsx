import { useRef, useState, type ReactElement } from 'react'
import { LoaderCircle, LogOut, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useLogout } from '@/modules/auth/hooks/useLogout'

type LogoutDialogProps = {
  trigger: ReactElement
}

export function LogoutDialog({ trigger }: LogoutDialogProps) {
  const { t } = useTranslation()
  const logout = useLogout()
  const isActivatingRef = useRef(false)
  const [isPending, setIsPending] = useState(false)

  const handleLogout = () => {
    if (isActivatingRef.current) return

    isActivatingRef.current = true
    setIsPending(true)

    try {
      logout()
    } catch (error) {
      isActivatingRef.current = false
      setIsPending(false)
      throw error
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent
        aria-busy={isPending}
        className="w-[calc(100%-2rem)] max-w-3xl gap-0 overflow-hidden rounded-xl border-0 bg-background p-0 shadow-dropdown"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault()
        }}
      >
        <AlertDialogHeader className="flex min-h-22 flex-row items-center justify-between gap-4 bg-muted px-5 py-4 text-start sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <LogOut className="size-5 shrink-0 text-foreground" aria-hidden />
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              {t('auth.logout.title')}
            </AlertDialogTitle>
          </div>
          <AlertDialogCancel
            disabled={isPending}
            aria-label={t('auth.logout.close')}
            className="m-0 size-10 shrink-0 border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-accent"
          >
            <X className="size-5" aria-hidden />
          </AlertDialogCancel>
        </AlertDialogHeader>

        <AlertDialogDescription className="px-5 pb-4 pt-5 text-center text-base text-muted-foreground sm:px-8">
          {t('auth.logout.description')}
        </AlertDialogDescription>

        <AlertDialogFooter className="px-5 pb-6 sm:flex-row sm:px-8">
          <AlertDialogCancel
            disabled={isPending}
            className="h-12 flex-1 rounded-xl border-border bg-background text-muted-foreground hover:bg-muted"
          >
            {t('auth.logout.cancel')}
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={isPending}
            className="h-12 flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary-700"
            onClick={handleLogout}
          >
            {isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {isPending ? t('auth.logout.pending') : t('auth.logout.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

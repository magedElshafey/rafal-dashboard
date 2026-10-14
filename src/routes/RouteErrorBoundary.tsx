import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Routes } from './routes'
import { isChunkLoadError, refreshApplication, reportChunkLoadError } from './chunk-recovery'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const { t } = useTranslation()
  const heading = useRef<HTMLHeadingElement>(null)
  const chunkFailure = isChunkLoadError(error)
  const status = isRouteErrorResponse(error) ? error.status : undefined
  const kind = chunkFailure
    ? 'chunk'
    : status === 401
      ? 'unauthorized'
      : status === 403
        ? 'forbidden'
        : status === 404
          ? 'notFound'
          : status !== undefined
            ? status >= 500
              ? 'server'
              : 'request'
            : 'unexpected'
  const canRefresh = chunkFailure || kind === 'server' || kind === 'unexpected'

  useEffect(() => {
    heading.current?.focus()
    reportChunkLoadError(error)
  }, [error])

  return (
    <section aria-labelledby="route-error-title" className="mx-auto min-h-64 max-w-xl space-y-4 p-6 text-start">
      <h1 id="route-error-title" ref={heading} tabIndex={-1} className="text-xl font-semibold">
        {t(chunkFailure ? 'routeRecovery.title' : `routeRecovery.${kind}.title`)}
      </h1>
      <p>{t(chunkFailure ? 'routeRecovery.description' : `routeRecovery.${kind}.description`)}</p>
      {status !== undefined && <p>{t('routeRecovery.status', { status })}</p>}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to={Routes.root}>{t('errors.back_to_home')}</Link>
        </Button>
        {status === 401 && (
          <Button asChild>
            <Link to={Routes.login}>{t('routeRecovery.signIn')}</Link>
          </Button>
        )}
        {canRefresh && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>{t('routeRecovery.refresh')}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('routeRecovery.confirm')}</AlertDialogTitle>
                <AlertDialogDescription>{t('routeRecovery.unsaved')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={refreshApplication}>{t('routeRecovery.refresh')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </section>
  )
}

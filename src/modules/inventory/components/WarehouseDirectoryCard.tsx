import { ArrowRight, Warehouse } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardIcon } from '@/components/shared/dashboard/atoms/DashboardIcon'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { WarehouseListItem } from '@/modules/warehouses/types/warehouse.types'
import { Routes } from '@/routes/routes'

export function WarehouseDirectoryCard({ warehouse }: { warehouse: WarehouseListItem | null }) {
  const { t } = useTranslation()
  const statusId = useId()
  const content = (
    <DashboardCard
      padding="none"
      className="flex h-full min-w-0 flex-col motion-safe:transition-[border-color,box-shadow] group-hover:border-primary/40 group-hover:shadow-sm group-focus-visible:border-ring"
    >
      <div className="flex min-w-0 items-start gap-3 p-4 sm:p-5">
        <DashboardIcon
          icon={Warehouse}
          className="size-11 rounded-lg border border-border-subtle bg-muted/50 text-primary"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{t('inventory.directoryCategory')}</p>
            {warehouse ? (
              <Badge id={statusId} variant="outline" className="gap-1.5 motion-reduce:transition-none">
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${warehouse.isActive ? 'bg-success' : 'bg-muted-foreground'}`}
                />
                {t(warehouse.isActive ? 'warehouses.status.active' : 'warehouses.status.inactive')}
              </Badge>
            ) : (
              <Skeleton className="h-5 w-16" />
            )}
          </div>
          {warehouse ? (
            <h3 className="break-words text-lg font-semibold leading-7 text-foreground [overflow-wrap:anywhere]">
              <bdi>{warehouse.name}</bdi>
            </h3>
          ) : (
            <Skeleton className="h-7 w-40 max-w-full" />
          )}
        </div>
      </div>
      <div className="mt-auto flex min-h-12 items-center justify-between gap-3 border-t border-border-subtle px-4 py-3 text-sm font-medium text-primary sm:px-5">
        {warehouse ? (
          <span className="group-hover:underline underline-offset-4">{t('inventory.warehouseAction')}</span>
        ) : (
          <Skeleton className="h-5 w-28" />
        )}
        <ArrowRight className="size-4 shrink-0 rtl:rotate-180" aria-hidden />
      </div>
    </DashboardCard>
  )
  return warehouse ? (
    <Link
      to={Routes.warehouseInventoryPath(warehouse.id)}
      aria-label={t('inventory.warehouseActionNamed', { name: warehouse.name })}
      aria-describedby={statusId}
      className="group block h-full min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {content}
    </Link>
  ) : (
    content
  )
}

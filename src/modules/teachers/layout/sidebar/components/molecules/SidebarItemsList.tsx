import { memo, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

import { TSidebarItem } from '@/modules/teachers/layout/constants/sidebar-items'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { PortalNavLink } from '@/components/core/portal-link/components/PortalNavLink'
import { buildPortalPath } from '@/components/core/portal-link/utils/portal-path.helpers'

type SidebarItemsListProps = {
  sidebarItems: TSidebarItem[]
  onNavigate?: () => void
}

export const parentItemClassName = cn(
  'relative flex w-full items-center gap-2 rounded-s-sm px-3 py-2 transition-colors',
  'text-sm font-normal text-neutral-600 hover:text-primary-500',
  'data-[active=true]:bg-brand-500 data-[active=true]:font-medium data-[active=true]:text-white',
  'data-[state=open]:bg-brand-500 data-[state=open]:font-medium data-[state=open]:text-white'
)

const childItemClassName = cn(
  'flex  w-full items-center gap-2 rounded-md py-1 px-3 text-sm font-medium outline-none transition-colors',
  'text-neutral-600',
  'hover:bg-black-50 hover:text-black-700',
  'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
  'data-[active=true]:bg-black-50 data-[active=true]:text-black-700',
  'data-[active=true]:hover:bg-black-50 data-[active=true]:hover:text-black-700'
)

const SidebarItemsList = memo(function SidebarItemsList({ sidebarItems, onNavigate }: SidebarItemsListProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <ul className="space-y-1">
      {sidebarItems.map((item) => {
        const Icon = item.icon
        const hasChildren = Boolean(item.children?.length)

        if (hasChildren) {
          return <SidebarParentItem key={item.path} item={item} pathname={pathname} onNavigate={onNavigate} />
        }

        return (
          <li key={item.path}>
            <PortalNavLink className={parentItemClassName} to={item.path} onClick={onNavigate}>
              <Icon className="size-5 shrink-0" aria-hidden="true" />

              <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
            </PortalNavLink>
          </li>
        )
      })}
    </ul>
  )
})

type SidebarParentItemProps = {
  item: TSidebarItem
  pathname: string
  onNavigate?: () => void
}

function SidebarParentItem({ item, pathname, onNavigate }: SidebarParentItemProps) {
  const { t } = useTranslation()
  const Icon = item.icon
  const isRouteActive =
    isNavPathActive(pathname, item.path) ||
    Boolean(item.children?.some((child) => isNavPathActive(pathname, child.path)))
  const [manualExpansion, setManualExpansion] = useState<{ pathname: string; open: boolean } | null>(null)
  const isExpanded = manualExpansion?.pathname === pathname ? manualExpansion.open : isRouteActive
  const isParentActive = isRouteActive || isExpanded

  return (
    <li>
      <Collapsible
        open={isExpanded}
        onOpenChange={(open) => {
          setManualExpansion({ pathname, open })
        }}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            data-active={isParentActive}
            className={cn(parentItemClassName, 'group')}
            aria-label={t(item.labelKey)}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />

            <span className="min-w-0 flex-1 truncate text-start">{t(item.labelKey)}</span>

            <ChevronDown
              className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <ul className="mt-1 space-y-1 ps-5 pe-2">
            {item.children?.map((child) => {
              const ChildIcon = child.icon

              return (
                <li key={child.path}>
                  <PortalNavLink className={childItemClassName} to={child.path} onClick={onNavigate}>
                    {ChildIcon ? <ChildIcon className="size-4 shrink-0" aria-hidden="true" /> : null}

                    <span className="truncate">{t(child.labelKey)}</span>
                  </PortalNavLink>
                </li>
              )
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

function isNavPathActive(pathname: string, path: string) {
  const portalPath = buildPortalPath(path, { pathname })

  return Boolean(matchPath({ path: portalPath, end: false }, pathname))
}

export default SidebarItemsList

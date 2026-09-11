import { useCallback, useState } from 'react'

import type { EntityFormDrawerMode } from './entityFormDrawer.types'

type EntityFormDrawerState<TEntityId> = {
  open: boolean
  mode: EntityFormDrawerMode
  entityId: TEntityId | null
}

const INITIAL_DRAWER_STATE = {
  open: false,
  mode: 'create',
  entityId: null,
} as const

export const useEntityFormDrawer = <TEntityId extends string | number = string>() => {
  const [state, setState] = useState<EntityFormDrawerState<TEntityId>>(INITIAL_DRAWER_STATE)

  const openCreate = useCallback(() => {
    setState({
      open: true,
      mode: 'create',
      entityId: null,
    })
  }, [])

  const openEdit = useCallback((entityId: TEntityId) => {
    setState({
      open: true,
      mode: 'edit',
      entityId,
    })
  }, [])

  const close = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      open: false,
    }))
  }, [])

  const setOpen = useCallback((open: boolean) => {
    setState((currentState) => ({
      ...currentState,
      open,
    }))
  }, [])

  return {
    ...state,
    openCreate,
    openEdit,
    close,
    setOpen,
  }
}

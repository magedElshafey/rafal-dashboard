import { useCallback, useMemo, useRef, type MutableRefObject } from 'react'

type HierarchicalSelectionInitialization = {
  mainGroupsInitialized: boolean
  mainGroupsSettled: boolean
  subGroupsInitialized: boolean
  subGroupsSettled: boolean
  studentsInitialized: boolean
}

export type HierarchicalDefaultSelection = {
  enabled: boolean
  initialized: MutableRefObject<HierarchicalSelectionInitialization>
  reset: () => void
}

const createInitializationState = (): HierarchicalSelectionInitialization => ({
  mainGroupsInitialized: false,
  mainGroupsSettled: false,
  subGroupsInitialized: false,
  subGroupsSettled: false,
  studentsInitialized: false,
})

export function useHierarchicalDefaultSelection(enabled: boolean): HierarchicalDefaultSelection {
  const initialized = useRef<HierarchicalSelectionInitialization>(createInitializationState())

  const reset = useCallback(() => {
    initialized.current = createInitializationState()
  }, [])

  return useMemo(() => ({ enabled, initialized, reset }), [enabled, reset])
}

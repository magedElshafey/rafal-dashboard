import { useMainGroupsDdl, useSubGroupsDdl } from '@/hooks/ddl/groups/useGroupsDdl'

type UseGroupSubGroupDdlParams = {
  groupId?: string | number | null
}

export function useGroupSubGroupDdl({ groupId }: UseGroupSubGroupDdlParams) {
  const normalizedGroupId = groupId ? String(groupId) : ''

  const {
    data: groups,
    isLoading: isGroupsLoading,
    isFetching: isGroupsFetching,
    isError: isGroupsError,
    refetch: refetchGroups,
  } = useMainGroupsDdl()

  const {
    data: subGroups,
    isLoading: isSubGroupsLoading,
    isFetching: isSubGroupsFetching,
    isError: isSubGroupsError,
    refetch: refetchSubGroups,
  } = useSubGroupsDdl(normalizedGroupId)

  return {
    groupId: normalizedGroupId,

    groups,
    subGroups,

    isGroupsLoading,
    isGroupsFetching,
    isGroupsError,
    refetchGroups,

    isSubGroupsLoading,
    isSubGroupsFetching,
    isSubGroupsError,
    refetchSubGroups,

    isSubGroupDisabled: !normalizedGroupId || isSubGroupsLoading || isSubGroupsError,
  }
}

import { useMainGroupsDdl, useSubGroupsByGroupIdsDdl } from '@/hooks/ddl/groups/useGroupsDdl'

type GroupId = string | number

type UseGroupSubGroupMultiDdlParams = {
  groupIds?: readonly (GroupId | null | undefined)[]
}

export function useGroupSubGroupMultiDdl({ groupIds }: UseGroupSubGroupMultiDdlParams) {
  const {
    data: groups,
    isLoading: isGroupsLoading,
    isFetching: isGroupsFetching,
    isError: isGroupsError,
    error: groupsError,
    refetch: refetchGroups,
  } = useMainGroupsDdl()

  const {
    groupIds: normalizedGroupIds,
    data: subGroups,
    isLoading: isSubGroupsLoading,
    isFetching: isSubGroupsFetching,
    isError: isSubGroupsError,
    error: subGroupsError,
    refetch: refetchSubGroups,
    isDisabled: isSubGroupDisabled,
  } = useSubGroupsByGroupIdsDdl(groupIds)

  return {
    groupIds: normalizedGroupIds,

    groups,
    subGroups,

    isGroupsLoading,
    isGroupsFetching,
    isGroupsError,
    groupsError,
    refetchGroups,

    isSubGroupsLoading,
    isSubGroupsFetching,
    isSubGroupsError,
    subGroupsError,
    refetchSubGroups,

    isSubGroupDisabled,
  }
}

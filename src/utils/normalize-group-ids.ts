export type GroupId = string | number

export function normalizeGroupIds(groupIds?: readonly (GroupId | null | undefined)[]) {
  return Array.from(
    new Set(
      (groupIds ?? [])
        .map((groupId) => (groupId === null || groupId === undefined ? '' : String(groupId).trim()))
        .filter(Boolean)
    )
  ).sort((first, second) => first.localeCompare(second))
}

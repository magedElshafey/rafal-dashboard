export const assistantsDdlQueryKeys = {
  all: ['ddl', 'assistants'] as const,
  unfiltered: () => [...assistantsDdlQueryKeys.all, 'unfiltered'] as const,
  bySubGroup: (subGroupId: string) => [...assistantsDdlQueryKeys.all, 'subgroup', subGroupId] as const,
}

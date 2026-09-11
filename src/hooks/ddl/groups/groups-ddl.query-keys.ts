export const groupsDdlQueryKeys = {
  all: ['ddl', 'groups'] as const,

  main: () => [...groupsDdlQueryKeys.all, 'main'] as const,

  sub: (groupId: string | number) => [...groupsDdlQueryKeys.all, 'sub', String(groupId)] as const,
}

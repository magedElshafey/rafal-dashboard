export function assertNever(value: never): never {
  throw new Error(`Unhandled assignment status: ${JSON.stringify(value)}`)
}

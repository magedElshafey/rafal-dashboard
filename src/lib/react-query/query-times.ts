const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

export const queryTimes = {
  short: 5 * MINUTE,
  long: 30 * MINUTE,
  veryLong: HOUR,
} as const

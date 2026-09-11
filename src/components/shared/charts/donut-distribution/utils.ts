export function getPercentage(value: number, total: number) {
  if (!total) return 0

  return Math.round((value / total) * 100)
}

export function getChartTotal(data: { value: number }[]) {
  return data.reduce((acc, item) => acc + item.value, 0)
}

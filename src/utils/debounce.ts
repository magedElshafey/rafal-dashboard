type DebouncedFunction<TArgs extends unknown[]> = {
  (...args: TArgs): void
  cancel: () => void
}

export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  delay = 500
): DebouncedFunction<TArgs> {
  let timer: ReturnType<typeof setTimeout>

  const debounced = (...args: TArgs) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      func(...args)
    }, delay)
  }

  debounced.cancel = () => {
    clearTimeout(timer)
  }

  return debounced
}

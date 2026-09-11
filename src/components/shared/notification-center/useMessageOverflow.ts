import { useLayoutEffect, useRef, useState } from 'react'

// One observer for the notification list, with no window listener per card.
const measurements = new Map<Element, () => void>()
let observer: ResizeObserver | undefined

export function useMessageOverflow(body: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current?.firstElementChild
    if (!(element instanceof HTMLElement)) return
    const measure = () => setOverflowing(element.scrollHeight > element.clientHeight + 1)
    measure()
    measurements.set(element, measure)
    if (typeof ResizeObserver !== 'undefined') {
      observer ??= new ResizeObserver((entries) => {
        entries.forEach(({ target }) => measurements.get(target)?.())
      })
      observer.observe(element)
    }
    // Font loading can change wrapping without changing the clamped height.
    void document.fonts?.ready.then(() => measurements.get(element)?.())
    return () => {
      measurements.delete(element)
      observer?.unobserve(element)
      if (measurements.size === 0) {
        observer?.disconnect()
        observer = undefined
      }
    }
  }, [body])

  return { ref, overflowing }
}

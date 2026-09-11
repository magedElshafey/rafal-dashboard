import { useEffect, useRef } from 'react'

type UseInfiniteScrollParams = {
  enabled: boolean
  onLoadMore: () => void | Promise<unknown>
  operationKey?: string | number
  rootMargin?: string
}

function getVerticalRootMargins(rootMargin: string, viewportHeight: number) {
  const values = rootMargin.trim().split(/\s+/)
  const topValue = values[0] ?? '0px'
  const bottomValue = values.length === 1 ? topValue : (values[2] ?? topValue)

  const resolveMargin = (value: string) => {
    const numericValue = Number.parseFloat(value)

    if (!Number.isFinite(numericValue)) return 0

    return value.endsWith('%') ? (numericValue / 100) * viewportHeight : numericValue
  }

  return {
    top: resolveMargin(topValue),
    bottom: resolveMargin(bottomValue),
  }
}

export function useInfiniteScroll({
  enabled,
  onLoadMore,
  operationKey,
  rootMargin = '200px 0px',
}: UseInfiniteScrollParams) {
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    const triggerElement = triggerRef.current

    if (!enabled || !triggerElement) {
      return
    }

    let isActive = true
    let isLoading = false

    const loadMore = () => {
      if (!isActive || isLoading) return

      isLoading = true
      const onLoadMoreForAttempt = onLoadMoreRef.current

      Promise.resolve()
        .then(() => onLoadMoreForAttempt())
        .catch(() => undefined)
        .finally(() => {
          if (isActive) {
            isLoading = false
          }
        })
    }

    if (typeof IntersectionObserver === 'undefined') {
      if (typeof window === 'undefined') return

      let animationFrameId: number | undefined

      const checkTriggerPosition = () => {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight
        const { top: topMargin, bottom: bottomMargin } = getVerticalRootMargins(rootMargin, viewportHeight)
        const triggerBounds = triggerElement.getBoundingClientRect()
        const isWithinLoadRange =
          triggerBounds.bottom >= -topMargin && triggerBounds.top <= viewportHeight + bottomMargin

        if (isWithinLoadRange) {
          loadMore()
        }
      }

      const schedulePositionCheck = () => {
        if (typeof window.requestAnimationFrame !== 'function') {
          checkTriggerPosition()
          return
        }

        if (animationFrameId !== undefined) return

        animationFrameId = window.requestAnimationFrame(() => {
          animationFrameId = undefined
          checkTriggerPosition()
        })
      }

      window.addEventListener('scroll', schedulePositionCheck, { passive: true })
      window.addEventListener('resize', schedulePositionCheck)
      checkTriggerPosition()

      return () => {
        isActive = false
        window.removeEventListener('scroll', schedulePositionCheck)
        window.removeEventListener('resize', schedulePositionCheck)

        if (animationFrameId !== undefined) {
          window.cancelAnimationFrame(animationFrameId)
        }
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        loadMore()
      },
      { rootMargin }
    )

    observer.observe(triggerElement)

    return () => {
      isActive = false
      observer.disconnect()
    }
  }, [enabled, operationKey, rootMargin])

  return triggerRef
}

import { useEffect, useState } from 'react'

export const useResize = () => {
  const [mobile, setMobile] = useState<boolean>(false)
  const [mediumScreen, setMediumScreen] = useState<boolean>(false)
  useEffect(() => {
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { inlineSize } = entry.contentBoxSize[0]
        if (inlineSize < 769) {
          setMobile(true)
          setMediumScreen(false)
        } else if (inlineSize >= 769 && inlineSize <= 1250) {
          setMobile(false)
          setMediumScreen(true)
        } else {
          setMobile(false)
          setMediumScreen(false)
        }
      }
    })

    observer.observe(document.documentElement)

    return () => observer.unobserve(document.documentElement)
  }, [])

  return { mobile, mediumScreen }
}

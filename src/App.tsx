import './App.css'

import { Toaster } from 'sonner'
import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'

import { QueryClientProvider } from '@tanstack/react-query'

import { TransparentFallback } from '@/components/shared/TransparentFallback'
import { router } from '@/routes'
import { queryClient } from '@/lib/react-query/query-client'
import { AuthStorageSync } from '@/modules/auth/components/AuthStorageSync'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster
          richColors
          closeButton
          position="top-center"
          duration={4500}
          toastOptions={{
            classNames: {
              toast: 'z-[99999] min-h-14 w-[calc(100vw-2rem)] max-w-md rounded-xl px-5 py-4 text-base shadow-dropdown',
              title: 'text-base font-semibold',
              description: 'text-sm',
              closeButton: 'size-6',
            },
          }}
        />
        <AuthStorageSync />
        <Suspense fallback={<TransparentFallback />}>
          <RouterProvider router={router} />
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App

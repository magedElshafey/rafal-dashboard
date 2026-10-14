import '@/config/i18.ts'
import App from './App.tsx'
import { createRoot } from 'react-dom/client'
import { installChunkErrorListener } from '@/routes/chunk-recovery'

const removeChunkErrorListener = installChunkErrorListener()
if (import.meta.hot) import.meta.hot.dispose(removeChunkErrorListener)

createRoot(document.getElementById('root')!).render(<App />)

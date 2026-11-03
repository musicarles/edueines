import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/inter'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import { App } from './App'
import { AuthProvider } from './lib/auth/AuthProvider'
import { DataProvider } from './lib/data-context'

const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const root = document.getElementById('root')
if (!root) {
  throw new Error('No s’ha trobat el contenidor de l’aplicació.')
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={base}>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

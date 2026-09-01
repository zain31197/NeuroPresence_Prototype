import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { EngineProvider } from './mock/engine'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root container missing')

createRoot(container).render(
  <StrictMode>
    <EngineProvider>
      <App />
    </EngineProvider>
  </StrictMode>,
)

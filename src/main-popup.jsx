import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './main-popup.css'
import AppPopup from './AppPopup.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppPopup />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import OneSignal from 'react-onesignal'
import './index.css'
import App from './App.jsx'

// Initialize OneSignal for push notifications.
// The bell button is shown automatically — users click it to subscribe.
OneSignal.init({
  appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
  safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID,
  notifyButton: { enable: true },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

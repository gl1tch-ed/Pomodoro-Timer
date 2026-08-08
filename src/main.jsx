import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import AuthGate from './components/AuthGate.jsx'
import { AppStoreProvider } from './context/AppStore.jsx'
import './styles/theme.css'
import './styles/global.css'
import './styles/components.css'
import './styles/forest.css'
import './styles/world.css'
import './styles/background.css'
import './styles/auth.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate>
        <AppStoreProvider>
          <App />
        </AppStoreProvider>
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>,
)

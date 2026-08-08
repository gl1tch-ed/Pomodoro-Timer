import { useAuth } from '../context/AuthProvider.jsx'
import LoginPage from './LoginPage.jsx'

/*
  Decides what the signed-out user sees. When Supabase isn't configured the app
  runs open (dev/tests). Otherwise: a brief splash while the session resolves,
  the login screen when there's no user, and the app once signed in.
*/
export default function AuthGate({ children }) {
  const { isConfigured, loading, user } = useAuth()

  if (!isConfigured) return children
  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-splash">
          <span className="auth-mark" aria-hidden="true">🌱</span>
          <p className="muted">Loading…</p>
        </div>
      </div>
    )
  }
  if (!user) return <LoginPage />
  return children
}

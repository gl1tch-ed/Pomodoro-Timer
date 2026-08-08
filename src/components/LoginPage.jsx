import { useState } from 'react'
import { useAuth } from '../context/AuthProvider.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 6

/** The signed-out screen: sign in or create an account with email + password. */
export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  function switchMode(next) {
    setMode(next)
    setError('')
    setInfo('')
  }

  function validate() {
    if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.'
    if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`
    return ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    try {
      if (isSignup) {
        const { data, error: err } = await signUp(email, password)
        if (err) {
          setError(err.message)
          return
        }
        // With email confirmation on, a user is created but no session yet.
        if (data?.user && !data?.session) {
          setInfo('Almost there — check your email to confirm your account, then sign in.')
          setMode('signin')
        }
        // If confirmations are off, a session arrives and the gate swaps us in.
      } else {
        const { error: err } = await signIn(email, password)
        if (err) {
          setError(err.message)
          return
        }
        // Success: onAuthStateChange updates the session and the app renders.
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function onForgotPassword() {
    setError('')
    setInfo('')
    if (!EMAIL_RE.test(email)) {
      setError('Enter your email above first, then choose “Forgot password?”.')
      return
    }
    setBusy(true)
    try {
      const { error: err } = await resetPassword(email)
      if (err) setError(err.message)
      else setInfo('If that email has an account, a password-reset link is on its way.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card card">
        <div className="auth-brand">
          <span className="auth-mark" aria-hidden="true">🌱</span>
          <h1 className="auth-title">Bloom</h1>
          <p className="auth-sub">a calm place to focus</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Sign in or create an account">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            className={`auth-tab ${!isSignup ? 'is-active' : ''}`}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            className={`auth-tab ${isSignup ? 'is-active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>

          {error && (
            <p className="auth-msg auth-msg--error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="auth-msg auth-msg--info" role="status">
              {info}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>

          {!isSignup && (
            <button type="button" className="auth-forgot" onClick={onForgotPassword} disabled={busy}>
              Forgot password?
            </button>
          )}
        </form>

        <p className="auth-foot">
          {isSignup ? 'Already have an account?' : 'New to Bloom?'}{' '}
          <button
            type="button"
            className="auth-link"
            onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  )
}

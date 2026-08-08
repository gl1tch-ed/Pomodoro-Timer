import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the auth context so the page can be tested without Supabase.
const signIn = vi.fn()
const signUp = vi.fn()
const resetPassword = vi.fn()
vi.mock('../context/AuthProvider.jsx', () => ({
  useAuth: () => ({ signIn, signUp, resetPassword }),
}))

import LoginPage from './LoginPage.jsx'

beforeEach(() => {
  signIn.mockReset().mockResolvedValue({ error: null })
  signUp.mockReset().mockResolvedValue({ data: { user: null, session: null }, error: null })
  resetPassword.mockReset().mockResolvedValue({ error: null })
})

describe('LoginPage', () => {
  it('shows the sign-in form by default', () => {
    render(<LoginPage />)
    expect(screen.getByRole('tab', { name: 'Sign in', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Forgot password?')).toBeInTheDocument()
  })

  it('rejects an invalid email before calling the backend', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i)
    expect(signIn).not.toHaveBeenCalled()
  })

  it('rejects a too-short password', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('Email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), '123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 6/i)
    expect(signIn).not.toHaveBeenCalled()
  })

  it('signs in with valid credentials', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(signIn).toHaveBeenCalledWith('user@example.com', 'secret123')
  })

  it('surfaces a backend error', async () => {
    signIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
  })

  it('switches to create-account mode and signs up', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('tab', { name: 'Create account' }))
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(signUp).toHaveBeenCalledWith('new@example.com', 'secret123')
  })

  it('prompts to confirm email after sign-up when no session is returned', async () => {
    signUp.mockResolvedValue({ data: { user: { id: '1' }, session: null }, error: null })
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.click(screen.getByRole('tab', { name: 'Create account' }))
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/check your email/i)
  })

  it('sends a password reset for a valid email', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.click(screen.getByText('Forgot password?'))
    expect(resetPassword).toHaveBeenCalledWith('user@example.com')
    expect(await screen.findByRole('status')).toHaveTextContent(/reset link/i)
  })
})

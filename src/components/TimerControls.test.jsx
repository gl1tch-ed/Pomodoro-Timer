import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimerControls from './TimerControls.jsx'

describe('TimerControls', () => {
  it('shows Start when paused and Pause when running', () => {
    const { rerender } = render(
      <TimerControls isRunning={false} onToggle={() => {}} onReset={() => {}} onSkip={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    rerender(<TimerControls isRunning onToggle={() => {}} onReset={() => {}} onSkip={() => {}} />)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })

  it('wires the toggle, reset and skip handlers', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const onReset = vi.fn()
    const onSkip = vi.fn()
    render(<TimerControls isRunning={false} onToggle={onToggle} onReset={onReset} onSkip={onSkip} />)

    await user.click(screen.getByRole('button', { name: /start/i }))
    await user.click(screen.getByRole('button', { name: 'Reset timer' }))
    await user.click(screen.getByRole('button', { name: 'Skip to next phase' }))

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})

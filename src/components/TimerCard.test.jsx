import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TimerCard from './TimerCard.jsx'

describe('TimerCard', () => {
  it('renders the phase label and formatted time', () => {
    render(
      <TimerCard phase="focus" secondsLeft={1500} progress={0} isRunning={false} cycleCount={0} longEvery={4} />,
    )
    expect(screen.getByText('Focus')).toBeInTheDocument()
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('exposes an accessible label describing time remaining', () => {
    render(
      <TimerCard phase="short" secondsLeft={300} progress={0.5} isRunning cycleCount={0} longEvery={4} />,
    )
    expect(screen.getByRole('img', { name: 'Short Break: 5:00 remaining' })).toBeInTheDocument()
  })

  it('renders one cycle dot per longEvery, filling completed sessions', () => {
    const { container } = render(
      <TimerCard phase="focus" secondsLeft={1500} progress={0} isRunning={false} cycleCount={2} longEvery={4} />,
    )
    expect(container.querySelectorAll('.cycle-dot')).toHaveLength(4)
    expect(container.querySelectorAll('.cycle-dot.is-filled')).toHaveLength(2)
  })
})

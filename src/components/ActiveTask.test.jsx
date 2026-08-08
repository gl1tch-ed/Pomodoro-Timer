import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActiveTask from './ActiveTask.jsx'

describe('ActiveTask', () => {
  it('shows an empty prompt when no task is selected', () => {
    render(<ActiveTask task={null} />)
    expect(screen.getByText(/No task selected/i)).toBeInTheDocument()
  })

  it('shows the active task title and pomodoro progress', () => {
    render(<ActiveTask task={{ title: 'Write report', completedPomos: 1, estimate: 3 }} />)
    expect(screen.getByText('Focusing on')).toBeInTheDocument()
    expect(screen.getByText('Write report')).toBeInTheDocument()
    expect(screen.getByText('1/3 🍅')).toBeInTheDocument()
  })
})

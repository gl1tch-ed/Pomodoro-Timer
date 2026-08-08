import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModeTabs from './ModeTabs.jsx'

describe('ModeTabs', () => {
  it('renders the three timer modes', () => {
    render(<ModeTabs phase="focus" onSelect={() => {}} />)
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tab', { name: 'Focus' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Short Break' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Long Break' })).toBeInTheDocument()
  })

  it('marks the current phase as selected', () => {
    render(<ModeTabs phase="short" onSelect={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Short Break', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Focus' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onSelect with the chosen phase key', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ModeTabs phase="focus" onSelect={onSelect} />)
    await user.click(screen.getByRole('tab', { name: 'Long Break' }))
    expect(onSelect).toHaveBeenCalledWith('long')
  })
})

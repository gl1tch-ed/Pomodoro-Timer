import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Statistics from './Statistics.jsx'
import { renderWithStore, seedStorage } from '../../test/utils.jsx'

// Read a headline stat's value by its label text.
function statValue(container, label) {
  const stat = [...container.querySelectorAll('.stat')].find(
    (el) => el.querySelector('.stat-label')?.textContent === label,
  )
  return stat?.querySelector('.stat-value')?.textContent
}

describe('Statistics', () => {
  it('renders an empty dashboard with a full 7-day chart', () => {
    const { container } = renderWithStore(<Statistics />)
    expect(statValue(container, 'Today')).toBe('0')
    expect(screen.getByText('0m all-time')).toBeInTheDocument()
    expect(container.querySelectorAll('.chart-col')).toHaveLength(7)
  })

  it('summarizes a seeded session logged today', () => {
    // A session dated "now" so it lands in today/this-week/streak.
    seedStorage({ history: [{ ts: Date.now(), minutes: 25, taskId: null }], tasks: [] })
    const { container } = renderWithStore(<Statistics />)

    expect(statValue(container, 'Today')).toBe('1')
    expect(statValue(container, 'This week')).toBe('1')
    expect(container.querySelector('.stat--accent .stat-value').textContent).toBe('1') // streak
    expect(screen.getByText('25m all-time')).toBeInTheDocument()
  })

  it('counts completed tasks', () => {
    seedStorage({
      tasks: [
        { id: '1', title: 'a', estimate: 1, completedPomos: 1, done: true },
        { id: '2', title: 'b', estimate: 1, completedPomos: 0, done: false },
      ],
    })
    const { container } = renderWithStore(<Statistics />)
    expect(statValue(container, 'Tasks done')).toBe('1')
    expect(screen.getByText('2 total')).toBeInTheDocument()
  })
})

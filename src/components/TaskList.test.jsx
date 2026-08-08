import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskList from './TaskList.jsx'
import { renderWithStore } from '../../test/utils.jsx'

describe('TaskList', () => {
  it('shows the empty state when there are no tasks', () => {
    renderWithStore(<TaskList activeTaskId={null} onActivate={() => {}} />)
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument()
  })

  it('adds a task via the form', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskList activeTaskId={null} onActivate={() => {}} />)
    await user.type(screen.getByLabelText('New task title'), 'Write E2E tests')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Write E2E tests')).toBeInTheDocument()
    expect(screen.queryByText(/No tasks yet/i)).not.toBeInTheDocument()
  })

  it('adjusts the estimate before adding', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskList activeTaskId={null} onActivate={() => {}} />)
    await user.click(screen.getByLabelText('Increase estimate'))
    expect(screen.getByText('2🍅')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Decrease estimate'))
    expect(screen.getByText('1🍅')).toBeInTheDocument()
  })

  it('completes a task (and clears it if it was active)', async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    renderWithStore(<TaskList activeTaskId={null} onActivate={onActivate} />)
    await user.type(screen.getByLabelText('New task title'), 'Ship it')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await user.click(screen.getByRole('button', { name: 'Mark task as done' }))
    expect(screen.getByRole('button', { name: 'Mark task as not done' })).toBeInTheDocument()
  })

  it('activates a task when its row is clicked', async () => {
    const user = userEvent.setup()
    const onActivate = vi.fn()
    renderWithStore(<TaskList activeTaskId={null} onActivate={onActivate} />)
    await user.type(screen.getByLabelText('New task title'), 'Focus me')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await user.click(screen.getByText('Focus me'))
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(onActivate).toHaveBeenCalledWith(expect.any(String))
  })

  it('removes a task', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskList activeTaskId={null} onActivate={() => {}} />)
    await user.type(screen.getByLabelText('New task title'), 'Delete me')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Delete me')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete task' }))
    expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
  })

  it('reorders tasks with the up/down controls', async () => {
    const user = userEvent.setup()
    const { container } = renderWithStore(<TaskList activeTaskId={null} onActivate={() => {}} />)
    const input = screen.getByLabelText('New task title')
    const addBtn = screen.getByRole('button', { name: 'Add' })

    await user.type(input, 'First')
    await user.click(addBtn)
    await user.type(input, 'Second')
    await user.click(addBtn)

    const titles = () => [...container.querySelectorAll('.task-title')].map((n) => n.textContent)
    expect(titles()).toEqual(['First', 'Second'])

    // move the first row down
    await user.click(screen.getAllByRole('button', { name: 'Move task down' })[0])
    expect(titles()).toEqual(['Second', 'First'])
  })

  it('shows a remaining-to-do count in the header', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskList activeTaskId={null} onActivate={() => {}} />)
    await user.type(screen.getByLabelText('New task title'), 'Only task')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    const header = screen.getByText('Tasks').closest('.card-title')
    expect(within(header).getByText(/1 to do/)).toBeInTheDocument()
  })
})

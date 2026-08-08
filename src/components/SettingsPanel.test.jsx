import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPanel from './SettingsPanel.jsx'
import { renderWithStore } from '../../test/utils.jsx'

describe('SettingsPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = renderWithStore(<SettingsPanel open={false} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the settings dialog when open', () => {
    renderWithStore(<SettingsPanel open onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    // Four interval number fields, defaulting to the app defaults.
    const numbers = screen.getAllByRole('spinbutton')
    expect(numbers).toHaveLength(4)
    expect(numbers[0]).toHaveValue(25) // Focus
  })

  it('changes an interval and persists it', () => {
    renderWithStore(<SettingsPanel open onClose={() => {}} />)
    const focus = screen.getAllByRole('spinbutton')[0]
    fireEvent.change(focus, { target: { value: '50' } })
    expect(focus).toHaveValue(50)
    expect(JSON.parse(localStorage.getItem('pomodoro.settings')).focusMin).toBe(50)
  })

  it('clamps an interval into the allowed range', () => {
    renderWithStore(<SettingsPanel open onClose={() => {}} />)
    const focus = screen.getAllByRole('spinbutton')[0]
    fireEvent.change(focus, { target: { value: '999' } })
    expect(focus).toHaveValue(180) // max
  })

  it('toggles auto-start breaks', async () => {
    const user = userEvent.setup()
    renderWithStore(<SettingsPanel open onClose={() => {}} />)
    const autoBreaks = screen.getAllByRole('checkbox')[0]
    expect(autoBreaks).not.toBeChecked()
    await user.click(autoBreaks)
    expect(autoBreaks).toBeChecked()
    expect(JSON.parse(localStorage.getItem('pomodoro.settings')).autoStartBreaks).toBe(true)
  })

  it('resets to defaults', () => {
    renderWithStore(<SettingsPanel open onClose={() => {}} />)
    const focus = screen.getAllByRole('spinbutton')[0]
    fireEvent.change(focus, { target: { value: '50' } })
    expect(focus).toHaveValue(50)
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(25)
  })

  it('calls onClose from the Done button and the close icon', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithStore(<SettingsPanel open onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: 'Close settings' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

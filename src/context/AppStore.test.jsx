import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppStore, DEFAULT_SETTINGS } from './AppStore.jsx'
import { StoreWrapper } from '../../test/utils.jsx'

function setup() {
  return renderHook(() => useAppStore(), { wrapper: StoreWrapper })
}

const COUNTRY = { id: 'USA', name: 'United States' }

describe('AppStore — tasks', () => {
  it('adds a task, trimming the title', () => {
    const { result } = setup()
    act(() => result.current.addTask('  Write tests  ', 3))
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0]).toMatchObject({
      title: 'Write tests',
      estimate: 3,
      completedPomos: 0,
      done: false,
    })
    expect(result.current.tasks[0].id).toBeTruthy()
  })

  it('ignores empty / whitespace-only titles', () => {
    const { result } = setup()
    act(() => result.current.addTask('   '))
    expect(result.current.tasks).toHaveLength(0)
  })

  it('clamps the estimate to at least 1 and truncates to an integer', () => {
    const { result } = setup()
    act(() => result.current.addTask('a', 0))
    act(() => result.current.addTask('b', 2.9))
    expect(result.current.tasks[0].estimate).toBe(1)
    expect(result.current.tasks[1].estimate).toBe(2)
  })

  it('updates and removes tasks', () => {
    const { result } = setup()
    act(() => result.current.addTask('x'))
    const id = result.current.tasks[0].id
    act(() => result.current.updateTask(id, { done: true }))
    expect(result.current.tasks[0].done).toBe(true)
    act(() => result.current.removeTask(id))
    expect(result.current.tasks).toHaveLength(0)
  })

  it('credits a pomodoro to a task, and no-ops on a null id', () => {
    const { result } = setup()
    act(() => result.current.addTask('x'))
    const id = result.current.tasks[0].id
    act(() => result.current.creditTaskPomodoro(id))
    expect(result.current.tasks[0].completedPomos).toBe(1)
    act(() => result.current.creditTaskPomodoro(null))
    expect(result.current.tasks[0].completedPomos).toBe(1)
  })

  it('moves tasks up/down and respects the list bounds', () => {
    const { result } = setup()
    act(() => result.current.addTask('A'))
    act(() => result.current.addTask('B'))
    act(() => result.current.addTask('C'))
    const [a, b] = result.current.tasks
    act(() => result.current.moveTask(b.id, -1)) // B up → B, A, C
    expect(result.current.tasks.map((t) => t.title)).toEqual(['B', 'A', 'C'])
    act(() => result.current.moveTask(b.id, -1)) // already first → no change
    expect(result.current.tasks.map((t) => t.title)).toEqual(['B', 'A', 'C'])
    act(() => result.current.moveTask(a.id, 1)) // A down (from index 1) → B, C, A
    expect(result.current.tasks.map((t) => t.title)).toEqual(['B', 'C', 'A'])
  })
})

describe('AppStore — history', () => {
  it('logs a focus session into history', () => {
    const { result } = setup()
    act(() => result.current.logSession(25, 'task-1'))
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]).toMatchObject({ minutes: 25, taskId: 'task-1', forestId: null })
    expect(typeof result.current.history[0].ts).toBe('number')
  })

  it('adds a session’s minutes to the active forest and tags its id', () => {
    const { result } = setup()
    act(() => result.current.chooseCountry(0, COUNTRY))
    act(() => result.current.logSession(25, null))
    expect(result.current.forests[0].focusMinutes).toBe(25)
    expect(result.current.history[0].forestId).toBe(result.current.forests[0].id)
  })

  it('clears history', () => {
    const { result } = setup()
    act(() => result.current.logSession(25, null))
    act(() => result.current.clearHistory())
    expect(result.current.history).toEqual([])
  })
})

describe('AppStore — forests', () => {
  it('pins the onboarding forest to a country with sane defaults', () => {
    const { result } = setup()
    act(() => result.current.chooseCountry(0, COUNTRY))
    expect(result.current.forests[0]).toMatchObject({
      index: 0,
      countryId: 'USA',
      countryName: 'United States',
      hueIndex: 0,
      completedAt: null,
      focusMinutes: 0,
      breaks: 0,
      tasksCompleted: 0,
    })
  })

  it('finalizes the previous forest when leveling up', () => {
    const { result } = setup()
    act(() => result.current.chooseCountry(0, COUNTRY))
    act(() => result.current.chooseCountry(1, { id: 'CAN', name: 'Canada' }))
    expect(result.current.forests[0].completedAt).toBeTruthy()
    expect(result.current.forests[1].index).toBe(1)
  })

  it('counts breaks and completed tasks toward the active forest', () => {
    const { result } = setup()
    act(() => result.current.chooseCountry(0, COUNTRY))
    act(() => result.current.addBreak())
    act(() => result.current.addTaskDone())
    expect(result.current.forests[0].breaks).toBe(1)
    expect(result.current.forests[0].tasksCompleted).toBe(1)
  })

  it('clears forests', () => {
    const { result } = setup()
    act(() => result.current.chooseCountry(0, COUNTRY))
    act(() => result.current.clearForests())
    expect(result.current.forests).toEqual([])
  })
})

describe('AppStore — settings', () => {
  it('patches settings and heals missing keys from defaults', () => {
    // Seed a partial settings object (missing longMin etc.)
    localStorage.setItem('pomodoro.settings', JSON.stringify({ focusMin: 99 }))
    const { result } = setup()
    act(() => result.current.updateSettings({ shortMin: 7 }))
    expect(result.current.settings.focusMin).toBe(99)
    expect(result.current.settings.shortMin).toBe(7)
    expect(result.current.settings.longMin).toBe(DEFAULT_SETTINGS.longMin)
  })

  it('resets to defaults but preserves the notification preference', () => {
    const { result } = setup()
    act(() => result.current.updateSettings({ focusMin: 50, notifications: true }))
    act(() => result.current.resetSettings())
    expect(result.current.settings.focusMin).toBe(DEFAULT_SETTINGS.focusMin)
    expect(result.current.settings.notifications).toBe(true)
  })
})

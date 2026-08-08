import { useState } from 'react'
import { useAppStore } from '../context/AppStore.jsx'
import TaskItem from './TaskItem.jsx'

/** The task panel: add new tasks and manage the list. */
export default function TaskList({ activeTaskId, onActivate }) {
  const { tasks, addTask, updateTask, removeTask, moveTask, addTaskDone } = useAppStore()
  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState(1)

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    addTask(title, estimate)
    setTitle('')
    setEstimate(1)
  }

  function toggleDone(id) {
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    updateTask(id, { done: !t.done })
    if (!t.done) {
      addTaskDone() // count a completion toward the active forest
      if (id === activeTaskId) onActivate(null)
    }
  }

  const remaining = tasks.filter((t) => !t.done).length

  return (
    <section className="card">
      <div className="card-title">
        <span>Tasks</span>
        {tasks.length > 0 && <span className="muted">· {remaining} to do</span>}
      </div>

      <form className="task-add" onSubmit={submit}>
        <input
          className="input"
          placeholder="What are you working on?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="New task title"
        />
        <div className="task-add-est" title="Estimated pomodoros">
          <button
            type="button"
            className="task-mini"
            onClick={() => setEstimate((e) => Math.max(1, e - 1))}
            aria-label="Decrease estimate"
          >
            −
          </button>
          <span className="est-value">{estimate}🍅</span>
          <button
            type="button"
            className="task-mini"
            onClick={() => setEstimate((e) => Math.min(20, e + 1))}
            aria-label="Increase estimate"
          >
            +
          </button>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
          Add
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty">No tasks yet. Add one above to start tracking your focus. 🌱</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task, i) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={task.id === activeTaskId}
              isFirst={i === 0}
              isLast={i === tasks.length - 1}
              onActivate={onActivate}
              onToggleDone={toggleDone}
              onEdit={updateTask}
              onMove={moveTask}
              onRemove={(id) => {
                removeTask(id)
                if (id === activeTaskId) onActivate(null)
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

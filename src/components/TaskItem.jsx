import { useState } from 'react'

/** A single task row: activate, track pomodoros, complete, edit, reorder, delete. */
export default function TaskItem({
  task,
  isActive,
  isFirst,
  isLast,
  onActivate,
  onToggleDone,
  onEdit,
  onMove,
  onRemove,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) onEdit(task.id, { title: trimmed })
    else setDraft(task.title)
    setEditing(false)
  }

  const pips = Array.from({ length: Math.max(task.estimate, task.completedPomos) })

  return (
    <li className={`task ${isActive ? 'is-active' : ''} ${task.done ? 'is-done' : ''}`}>
      <button
        className="task-check"
        onClick={() => onToggleDone(task.id)}
        aria-label={task.done ? 'Mark task as not done' : 'Mark task as done'}
        title={task.done ? 'Mark as not done' : 'Mark as done'}
      >
        {task.done ? '✓' : ''}
      </button>

      <div className="task-body" onClick={() => !task.done && onActivate(task.id)}>
        {editing ? (
          <input
            className="input task-edit"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(task.title)
                setEditing(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="task-title" title="Click to focus on this task">
            {task.title}
          </span>
        )}
        <div className="task-pips" aria-label={`${task.completedPomos} of ${task.estimate} pomodoros`}>
          {pips.map((_, i) => (
            <span key={i} className={`pip ${i < task.completedPomos ? 'is-filled' : ''}`} />
          ))}
        </div>
      </div>

      <div className="task-actions">
        <button
          className="task-mini"
          onClick={() => onMove(task.id, -1)}
          disabled={isFirst}
          aria-label="Move task up"
          title="Move up"
        >
          ↑
        </button>
        <button
          className="task-mini"
          onClick={() => onMove(task.id, 1)}
          disabled={isLast}
          aria-label="Move task down"
          title="Move down"
        >
          ↓
        </button>
        <button
          className="task-mini"
          onClick={() => {
            setDraft(task.title)
            setEditing(true)
          }}
          aria-label="Edit task"
          title="Edit"
        >
          ✎
        </button>
        <button
          className="task-mini task-danger"
          onClick={() => onRemove(task.id)}
          aria-label="Delete task"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </li>
  )
}

/** Shows the task currently driving the timer, just below the controls. */
export default function ActiveTask({ task }) {
  if (!task) {
    return (
      <p className="active-task active-task--empty">
        No task selected · pick one from your list to track it
      </p>
    )
  }
  return (
    <div className="active-task">
      <span className="active-task-eyebrow">Focusing on</span>
      <span className="active-task-title">{task.title}</span>
      <span className="active-task-count">
        {task.completedPomos}/{task.estimate} 🍅
      </span>
    </div>
  )
}

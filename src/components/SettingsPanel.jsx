import { useAppStore } from '../context/AppStore.jsx'

/** Settings modal: custom intervals, long-break cadence, auto-start & notifications. */
export default function SettingsPanel({ open, onClose }) {
  const { settings, updateSettings, resetSettings } = useAppStore()

  if (!open) return null

  function num(key, value, { min = 1, max = 180 } = {}) {
    const n = Math.round(Number(value))
    if (Number.isNaN(n)) return
    updateSettings({ [key]: Math.min(max, Math.max(min, n)) })
  }

  async function onToggleNotifications(checked) {
    if (checked && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        /* ignore */
      }
    }
    const granted = !('Notification' in window) ? false : Notification.permission === 'granted'
    updateSettings({ notifications: checked && granted })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Settings</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-section">
          <h3 className="settings-heading">Intervals (minutes)</h3>
          <div className="settings-grid">
            <NumberField
              label="Focus"
              value={settings.focusMin}
              onChange={(v) => num('focusMin', v)}
            />
            <NumberField
              label="Short break"
              value={settings.shortMin}
              onChange={(v) => num('shortMin', v)}
            />
            <NumberField
              label="Long break"
              value={settings.longMin}
              onChange={(v) => num('longMin', v)}
            />
            <NumberField
              label="Long break every"
              value={settings.longEvery}
              onChange={(v) => num('longEvery', v, { min: 2, max: 12 })}
              suffix="sessions"
            />
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-heading">Automation</h3>
          <div className="stack">
            <Toggle
              label="Auto-start breaks"
              checked={settings.autoStartBreaks}
              onChange={(v) => updateSettings({ autoStartBreaks: v })}
            />
            <Toggle
              label="Auto-start next focus"
              checked={settings.autoStartFocus}
              onChange={(v) => updateSettings({ autoStartFocus: v })}
            />
            <Toggle
              label="Desktop notifications"
              checked={settings.notifications}
              onChange={onToggleNotifications}
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={resetSettings}>
            Reset to defaults
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function NumberField({ label, value, onChange, suffix }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="number-wrap">
        <input
          className="number-input"
          type="number"
          inputMode="numeric"
          value={value}
          min="1"
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="number-suffix">{suffix}</span>}
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="switch spread" style={{ width: '100%', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <span className="row" style={{ gap: 0 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="track">
          <span className="thumb" />
        </span>
      </span>
    </label>
  )
}

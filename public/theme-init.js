// Set the theme before first paint to avoid a flash of the wrong theme.
// Kept as a static file (not inline) so the CSP can use script-src 'self'.
(function () {
  try {
    var raw = localStorage.getItem('pomodoro.theme')
    var t = raw ? JSON.parse(raw) : null
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    document.documentElement.dataset.theme = t
  } catch (e) {
    document.documentElement.dataset.theme = 'light'
  }
})()

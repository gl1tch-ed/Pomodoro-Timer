# 🌱 Bloom

**A calm place to focus.** Bloom is an aesthetic Pomodoro timer that turns your focus time into a
forest growing across the world. Set a timer, track your tasks, watch your stats — and every hour of
focus plants a tree in a country you choose on an interactive globe.

Built with React + Vite. Runs entirely in the browser; sign in with email to sync your progress
across devices.

<!-- Screenshots: drop images in ./assets and reference them here, e.g.
![Timer](assets/timer.png) ![Forest](assets/forest.png)
-->

---

## Features

- **⏳ Pomodoro timer** — Focus / Short Break / Long Break with custom intervals, an animated
  progress ring, a live tab-title countdown, spacebar to start/pause, and a gentle completion chime.
- **✅ Task tracking** — add, estimate, reorder, and complete tasks; the active task is credited a
  pomodoro on each focus session.
- **📊 Statistics** — today / this week / all-time counts, a daily streak, and a 7-day focus chart.
- **🌍 Grow a forest across the world** — every hour of focus grows a tree. A forest is a 24-tree
  plot pinned to a **country** on a hand-drawn, rotatable ink globe; fill it and choose the next
  country. Forested countries green up by tree density and their coastline tints blue.
- **🎨 Light & dark themes** — a soft moss gradient in light, a Charcoal theme in dark, with a
  frosted-glass UI. Theme is remembered and set before first paint (no flash).
- **🔐 Accounts & cloud sync** *(optional)* — sign in with email/password (via Supabase) to sync
  your tasks, history, forests, and settings across devices, live via realtime.

> Auth is **optional**: with no Supabase keys configured, Bloom runs fully local (state in
> `localStorage`). Add keys and it gates behind a login and syncs per user.

---

## Tech stack

- **React 18 + Vite 5** (plain JavaScript, no TypeScript)
- **Plain CSS** with custom-property theming (light/dark tokens)
- **[d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client) + [world-atlas](https://github.com/topojson/world-atlas)** — the interactive globe
- **[Supabase](https://supabase.com)** — email/password auth + per-user data (Postgres + Row Level Security + Realtime)
- **Vitest + React Testing Library** (unit / hooks / store / component) and **Playwright** (E2E)

---

## Getting started

**Prerequisites:** Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Then open **http://localhost:5173**.

### Build

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

---

## Configuration (optional — enables accounts & sync)

Bloom works without any configuration. To turn on accounts and cross-device sync, connect a Supabase
project:

1. Create a free project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase **SQL Editor** (creates the
   `user_state` table, Row Level Security policies, and enables Realtime).
3. Copy `.env.example` to `.env.local` and fill in your keys:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

The `anon` key is safe to expose in the browser — it's protected by Row Level Security. **Never** use
the `service_role` key in client code.

---

## Testing

```bash
npm run test        # unit / hooks / store / component tests (Vitest, run once)
npm run test:watch  # Vitest in watch mode
npm run e2e         # end-to-end browser tests (Playwright)
```

Playwright needs its browser once: `npx playwright install chromium`.

---

## Deployment

Bloom is a static build — deploy `dist/` to any static host. Config for **Vercel**
([`vercel.json`](vercel.json)) and **Netlify** ([`netlify.toml`](netlify.toml)) is included.

Remember to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your host's environment
variables, and point your Supabase Auth **Site URL / Redirect URLs** at the deployed domain.

See **[DEPLOY.md](DEPLOY.md)** for the full step-by-step (Supabase setup, env vars, both hosts, and a
post-deploy smoke test).

---

## How the forest works

- **1 hour of focus = 1 tree.** Leftover minutes grow a partial sapling, so effort is always visible.
- A **forest** is one **24-tree plot** pinned to a country you pick on the globe. Fill it and you
  choose the next country (the next "level").
- On the globe, a forested country **greens up by tree density** and the surrounding sea tints blue.
- The whole forest is **derived from your focus history** — nothing extra to track.

---

## Project structure

```
src/
  main.jsx                # entry; providers + global CSS
  App.jsx                 # layout, timer wiring, theme
  context/
    AppStore.jsx          # persisted store: settings, tasks, history, forests (+ cloud sync)
    AuthProvider.jsx      # Supabase auth context
  hooks/
    useTimer.js           # drift-corrected countdown engine
    useLocalStorage.js    # JSON localStorage state
    useCloudSync.js       # per-user Supabase sync + realtime
  lib/supabase.js         # Supabase client
  utils/                  # time, stats, forest, world, rng (pure, tested)
  components/             # Timer, Tasks, Statistics, Settings, Forest/Globe, LoginPage
  styles/                 # theme + global + component CSS
supabase/schema.sql       # database schema + RLS + realtime
e2e/                      # Playwright specs
```

---

## Privacy

- **Without accounts:** all data lives in your browser's `localStorage` — nothing leaves your device.
- **With accounts:** your data is stored in your own row in Supabase, protected by Row Level
  Security so only you can read or write it.

---

## License

MIT — add a `LICENSE` file before publishing if you want this to be official.

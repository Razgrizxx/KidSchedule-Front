# KidSchedule — Frontend

React + TypeScript + Vite frontend for the KidSchedule co-parenting platform.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or later |
| npm | 9 or later |
| KidSchedule API | Running on port 3000 |

> The frontend expects the backend to be running locally before you start. See the [backend README](../kidSchedule/README.md) for setup instructions.

---

## Local Setup

### 1. Install dependencies

```bash
cd KidScheduleFront
npm install
```

### 2. Verify the API base URL

The app points to `http://localhost:3000/api/v1` by default (hardcoded in `src/api.ts`).
If your backend runs on a different port, update that file.

### 3. Start the development server

```bash
npm run dev
```

The app will be available at **`http://localhost:5173`**

---

## Full Stack Quickstart

Open two terminals:

**Terminal 1 — Backend**
```bash
cd kidSchedule
npm run start:dev
```

**Terminal 2 — Frontend**
```bash
cd KidScheduleFront
npm run dev
```

Then open **`http://localhost:5173`** in your browser.

**Test login (from the seed):**

| Field | Value |
|-------|-------|
| Email | `christian@kidschedule.app` |
| Password | `Admin@2026!` |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Public Routes

| Path | Page |
|------|------|
| `/` | Landing page |
| `/families` | Busy Families landing |
| `/co-parents` | Co-Parents landing |
| `/teams` | Teams & Clubs landing |
| `/pta` | PTAs & Schools landing |
| `/blog` | Blog list |
| `/blog/:slug` | Blog post detail |
| `/login` | Login / Register |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset (via email link) |

## Dashboard Routes (require login)

| Path | Page |
|------|------|
| `/dashboard` | Home / overview |
| `/dashboard/calendar` | Custody calendar |
| `/dashboard/family` | Children, members, caregivers |
| `/dashboard/messages` | Family messaging |
| `/dashboard/expenses` | Shared expenses |
| `/dashboard/requests` | Custody change requests |
| `/dashboard/moments` | Photo gallery |
| `/dashboard/mediation` | Mediation tools |
| `/dashboard/settings` | Family and user settings |

---

## Project Structure

```
src/
├── api.ts                  # Axios instance (base URL + auth interceptor)
├── App.tsx                 # Route definitions
├── components/
│   ├── dashboard/          # Layout, Sidebar, TopBar, modals
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # TanStack Query hooks per domain
│   ├── useDashboard.ts
│   ├── useCalendar.ts
│   ├── useMessages.ts
│   ├── useExpenses.ts
│   ├── useRequests.ts
│   ├── useMoments.ts
│   ├── useSettings.ts
│   └── useBlog.ts
├── pages/
│   ├── dashboard/          # All authenticated app pages
│   ├── BlogListPage.tsx
│   ├── BlogDetailPage.tsx
│   ├── CoParentsPage.tsx
│   ├── FamiliesPage.tsx
│   ├── PTAPage.tsx
│   └── TeamsPage.tsx
├── store/
│   └── authStore.ts        # Zustand store (token, user, theme)
└── types/
    └── api.ts              # Shared TypeScript interfaces
```

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| React 19 + TypeScript | UI framework |
| Vite | Dev server and bundler |
| React Router v7 | Client-side routing |
| TanStack Query | Server state, caching, mutations |
| Zustand | Client state (auth, appearance) |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI component primitives |
| Framer Motion | Animations |
| Axios | HTTP client |
| react-markdown | Markdown rendering (blog) |
| react-hook-form + Zod | Form validation |

# LifeOS Planning Module: Implementation Tasks V2

> **Version**: 2.0.0  
> **Date**: 2025-12-06  
> **Input**: plan.md V2, spec.md V2

This document breaks down the technical plan into atomic, verifiable implementation tasks.

---

## Task Format

`[Status] TXX [Flags] Description`

- **Status**: `[X]` Done, `[ ]` Todo, `[~]` In Progress, `[-]` Suspended
- **Flags**: `[P]` Parallelizable, `[D:TXX]` Depends on task XX

---

## Phase 1: Database Migration

**Goal**: Update schema for V2 features (timer, media, dependencies, preferences)

- [ ] T01 Create migration file `supabase/migrations/20251206000000_lifeos_planning_v2.sql`
- [ ] T02 [D:T01] Add timer columns to `lifeos_tasks` table
- [ ] T03 [D:T01] Add `is_dynamic` column to `lifeos_routine_instance_tasks` table
- [ ] T04 [D:T01] Create `lifeos_tracking_media` table with RLS
- [ ] T05 [D:T01] Create `lifeos_task_dependencies` table with RLS
- [ ] T06 [D:T01] Create `lifeos_user_preferences` table with RLS
- [ ] T07 [D:T01] Create storage bucket `lifeos-media` with RLS policy
- [ ] T08 [D:T01-T07] Run migration: `supabase db push`
- [ ] T09 [D:T08] Regenerate TypeScript types: `supabase gen types typescript --local`

**Checkpoint**: All tables created, types updated

---

## Phase 2: Dependencies & Schemas

**Goal**: Install Kibo-UI, update Zod schemas

- [ ] T10 [P] Install rrule: `pnpm add rrule`
- [ ] T11 [P] Install Kibo-UI calendar: `npx shadcn@latest add "https://www.kibo-ui.com/r/calendar.json"`
- [ ] T12 [P] Install Kibo-UI mini-calendar: `npx shadcn@latest add "https://www.kibo-ui.com/r/mini-calendar.json"`
- [ ] T13 [P] Install Kibo-UI gantt: `npx shadcn@latest add "https://www.kibo-ui.com/r/gantt.json"`
- [ ] T14 [D:T09] Update `tasks.schema.ts` with timer fields
- [ ] T15 [D:T09] Create `media.schema.ts` for tracking media
- [ ] T16 [D:T09] Create `preferences.schema.ts` for user preferences
- [ ] T17 [D:T09] Update `projects.schema.ts` with dependencies
- [ ] T18 [D:T09] Create `calendar.schema.ts` for calendar events

**Checkpoint**: All dependencies installed, schemas ready

---

## Phase 3: Services Layer

**Goal**: Implement business logic for new features

- [ ] T19 [D:T14] Update `tasks.service.ts` with timer logic (start/pause/stop)
- [ ] T20 [D:T15] Create `media.service.ts` for upload/delete/list
- [ ] T21 [D:T16] Create `preferences.service.ts` for user preferences
- [ ] T22 [D:T17] Create `projects.service.ts` with progress calculation
- [ ] T23 [D:T18] Create `calendar.service.ts` for data aggregation
- [ ] T24 [D:T18] Update `routine-instances.service.ts` for auto-generation (14 days)
- [ ] T25 [D:T18] Create conflict detection logic in `calendar.service.ts`

**Checkpoint**: All services implemented and tested

---

## Phase 4: Server Actions

**Goal**: Create Server Actions for all new features

- [ ] T26 [D:T19] Add timer actions to `tasks.actions.ts`
- [ ] T27 [D:T20] Create `media.actions.ts`
- [ ] T28 [D:T21] Create `preferences.actions.ts`
- [ ] T29 [D:T22] Update `projects.actions.ts` with dependencies
- [ ] T30 [D:T23] Create `calendar.actions.ts`
- [ ] T31 [D:T24] Add generation actions to `routines.actions.ts`

**Checkpoint**: All Server Actions ready

---

## Phase 5: Navigation Restructure

**Goal**: Update sidebar for new information architecture

- [ ] T32 Update `app-sidebar.tsx` with new structure:
  - LifeOS section: Calendar, Tasks, Routines, Projects, Statistics
  - Configuration section: Domains, Preferences
- [ ] T33 Create `/app/app/lifeos/calendar/page.tsx` (new main page)
- [ ] T34 Update `/app/app/lifeos/page.tsx` to redirect to calendar
- [ ] T35 [P] Create `/app/app/settings/domains/page.tsx` (move domains here)
- [ ] T36 [P] Create `/app/app/settings/preferences/page.tsx`
- [ ] T37 [P] Create `/app/app/lifeos/projects/page.tsx`
- [ ] T38 [P] Create `/app/app/lifeos/projects/[id]/page.tsx`
- [ ] T39 [P] Create `/app/app/lifeos/statistics/page.tsx`

**Checkpoint**: Navigation working, all routes accessible

---

## Phase 6: Calendar Components

**Goal**: Build the calendar interface

### 6.1 Calendar Core
- [ ] T40 [D:T11] Create `calendar-view.tsx` wrapper component
- [ ] T41 [D:T40] Create `calendar-header.tsx` (navigation, view toggle)
- [ ] T42 [D:T40] Create `calendar-sidebar.tsx` (mini-cal, filters)
- [ ] T43 [D:T40] Create `calendar-event.tsx` (single event display)

### 6.2 Calendar Views
- [ ] T44 [D:T40] Create `week-view.tsx` (7-column time grid)
- [ ] T45 [D:T40] Create `month-view.tsx` (Kibo-UI calendar customized)
- [ ] T46 [D:T40] Adapt existing `timeline-view.tsx` as `day-view.tsx`

### 6.3 Calendar Modals
- [ ] T47 [D:T43] Create `event-modal.tsx` (view/edit routine instance or task)
- [ ] T48 [D:T47] Create `quick-add-modal.tsx` (fast creation from calendar)

### 6.4 Calendar Integration
- [ ] T49 [D:T33,T40-T48] Integrate calendar in `/app/app/lifeos/calendar/page.tsx`
- [ ] T50 [D:T49] Connect to Server Actions for data fetching
- [ ] T51 [D:T49] Implement filter state management (show/hide routines/tasks/domains)

**Checkpoint**: Calendar fully functional with all views

---

## Phase 7: Task Timer

**Goal**: Implement timer functionality

- [ ] T52 [D:T26] Create `task-timer.tsx` component
- [ ] T53 [D:T52] Integrate timer in `task-card.tsx`
- [ ] T54 [D:T52] Integrate timer in task detail modal
- [ ] T55 [D:T52] Add timer display in calendar events

**Checkpoint**: Timer working on tasks

---

## Phase 8: Media Attachments

**Goal**: Implement media upload for tracking

- [ ] T56 [D:T27] Create `media-uploader.tsx` component (drag & drop)
- [ ] T57 [D:T56] Create `media-gallery.tsx` component (grid display)
- [ ] T58 [D:T56] Create `media-preview.tsx` component (lightbox)
- [ ] T59 [D:T56-T58] Integrate media in `completion-modal.tsx` (routine tracking)
- [ ] T60 [D:T56-T58] Integrate media in task detail modal

**Checkpoint**: Media upload/display working

---

## Phase 9: Projects & Gantt

**Goal**: Implement projects with Gantt visualization

- [ ] T61 [D:T29] Create `project-card.tsx` component
- [ ] T62 [D:T61] Create `project-form.tsx` component
- [ ] T63 [D:T61] Create `projects-list.tsx` component
- [ ] T64 [D:T13,T29] Create `project-gantt.tsx` (Kibo-UI Gantt wrapper)
- [ ] T65 [D:T61-T64] Integrate in `/app/app/lifeos/projects/page.tsx`
- [ ] T66 [D:T64] Create dependency management UI in project detail
- [ ] T67 [D:T66] Integrate in `/app/app/lifeos/projects/[id]/page.tsx`

**Checkpoint**: Projects with Gantt working

---

## Phase 10: Routine Instance Generation

**Goal**: Auto-generate routine instances for 14-day horizon

- [ ] T68 [D:T31] Implement RRULE parsing in routine-instances.service.ts
- [ ] T69 [D:T68] Create `generateInstancesForTemplate()` function
- [ ] T70 [D:T69] Call generation on routine template create/update
- [ ] T71 [D:T69] Call generation when navigating to future dates
- [ ] T72 [D:T69] Add "Regenerate" button in routine management

**Checkpoint**: Instances auto-generated correctly

---

## Phase 11: Task Linking

**Goal**: Link tasks to routine instances during tracking

- [ ] T73 [D:T59] Create `task-linking-modal.tsx` component
- [ ] T74 [D:T73] Add existing task search/select
- [ ] T75 [D:T73] Add dynamic task quick-create (with is_dynamic flag)
- [ ] T76 [D:T73] Integrate in `completion-modal.tsx`
- [ ] T77 [D:T75] Update `routine_instance_tasks` with time_spent per task

**Checkpoint**: Task linking working with dynamic flag

---

## Phase 12: Statistics

**Goal**: Build statistics dashboard

- [ ] T78 [D:T30] Create `stats-overview.tsx` (summary cards)
- [ ] T79 [D:T78] Create `domain-time-chart.tsx` (time by domain)
- [ ] T80 [D:T78] Create `completion-chart.tsx` (weekly trend)
- [ ] T81 [D:T78] Create `streaks-list.tsx` (active streaks)
- [ ] T82 [D:T78-T81] Integrate in `/app/app/lifeos/statistics/page.tsx`
- [ ] T83 [D:T82] Add dynamic vs existing task ratio stat

**Checkpoint**: Statistics dashboard complete

---

## Phase 13: Polish & Fixes

**Goal**: Final touches and bug fixes

- [ ] T84 [P] Add loading skeletons for calendar views
- [ ] T85 [P] Add empty states for all lists
- [ ] T86 [P] Implement responsive design for mobile
- [ ] T87 [P] Add toast notifications for all actions
- [ ] T88 Fix existing bug: marking routine as complete
- [ ] T89 Performance audit: calendar navigation < 200ms
- [ ] T90 Accessibility audit: keyboard navigation, ARIA labels

**Checkpoint**: MVP complete and polished

---

## Phase Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | T01-T09 | Database Migration |
| 2 | T10-T18 | Dependencies & Schemas |
| 3 | T19-T25 | Services Layer |
| 4 | T26-T31 | Server Actions |
| 5 | T32-T39 | Navigation Restructure |
| 6 | T40-T51 | Calendar Components |
| 7 | T52-T55 | Task Timer |
| 8 | T56-T60 | Media Attachments |
| 9 | T61-T67 | Projects & Gantt |
| 10 | T68-T72 | Routine Instance Generation |
| 11 | T73-T77 | Task Linking |
| 12 | T78-T83 | Statistics |
| 13 | T84-T90 | Polish & Fixes |

**Total**: 90 tasks

---

## Suspended Tasks (From V1)

These tasks from the original spec are suspended for Phase 2+:

- [-] AI Schedule Generation (feature/ai/scheduler.ts)
- [-] Google Calendar Sync (feature/calendar-sync)
- [-] OKR Module (Phase 3)
- [-] Advanced AI Insights

The code exists but is not actively used in V2 MVP.

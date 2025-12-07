# LifeOS Planning Module: Technical Specification V2

> **Version**: 2.0.0  
> **Date**: 2025-12-06  
> **Status**: Active Development  
> **Branch**: 001-lifeos-planning

This document outlines the technical specifications for the **LifeOS Planning Module**, the core feature of the LifeOS system within VTT Labs. This is a **Calendar-Centric** approach where users visualize and manage their routines, tasks, and projects through an interactive calendar interface.

---

## 1. Project Vision & Mission

- **Vision**: Create a personal operating system that helps users align their daily actions with their long-term goals through intentional planning, execution tracking, and insightful analytics.
- **Mission**: Build an MVP of a calendar-centric planning application with:
  - Interactive calendar views (day/week/month)
  - Routine management with automatic instance generation
  - Task management with timer and project grouping
  - Execution tracking with media attachments
  - Basic statistics and streak tracking

---

## 2. Architecture Overview

### 2.1 Module Hierarchy

```
VTT LABS (Platform)
└── LIFEOS (Module Principal)
    ├── FOUNDATIONS (Shared across all LifeOS modules)
    │   ├── Domains of Life
    │   ├── User Preferences
    │   └── Metrics Engine (future)
    │
    ├── PLANNING MODULE (MVP - This Spec) ← CURRENT FOCUS
    │   ├── Calendar
    │   ├── Routines
    │   ├── Tasks
    │   ├── Projects
    │   └── Statistics
    │
    └── EXTENSION MODULES (Future - Phase 2+)
        ├── OKR (Phase 3)
        ├── Finance
        ├── Journal
        ├── Reading
        └── ...
```

### 2.2 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary View | Calendar (Week by default) | Familiar paradigm, immediate visualization |
| AI Scheduling | **SUSPENDED** (Phase 2+) | MVP uses logical algorithm, user controls placement |
| Routine Generation | Auto 14-day rolling horizon | Balance between planning ahead and flexibility |
| Conflict Resolution | Manual via Panel | User decides priorities, not the system |
| Media Attachments | Included in MVP | User request for tracking memories |

---

## 3. Core Features

### 3.1 Calendar (Primary Interface)

**Description**: Interactive calendar displaying routines and tasks with multiple views.

**Views**:
- **Day View**: Vertical timeline (reuse existing `timeline-view.tsx`)
- **Week View**: 7-column grid with time slots (default view)
- **Month View**: Grid overview with event indicators

**Features**:
- Toggle visibility: Routines ON/OFF, Tasks ON/OFF
- Filter by domain (multi-select)
- Mini-calendar for quick date navigation
- Current time indicator
- Drag & drop to reschedule (flexible items only)
- Click to view/edit details

**Component**: Kibo-UI Calendar (customized)

### 3.2 Routines

**Description**: Recurring activities with templates and instances.

#### Routine Templates (Definition)
- `name`: Title of the routine
- `domain_id`: Link to domain of life
- `category_moment`: morning | noon | afternoon | evening | night
- `category_type`: professional | personal | spiritual | health | learning | leisure | energy
- `constraints`: JSON (duration_minutes, preferred_start, preferred_end, target_value, target_unit)
- `recurrence_rule`: RRULE string (daily, specific days, weekly, monthly)
- `is_flexible`: Can be moved by user
- `priority`: high | medium | low

#### Routine Instances (Occurrences)
- Auto-generated for next 14 days based on recurrence_rule
- Trackable: status, actual times, actual value, mood, energy, notes
- Can link tasks worked during the routine
- Can attach media (photos, videos, audio, documents)

#### Task Linking
- **Any routine** can have tasks associated (not just "work" routines)
- Tasks can be:
  - **Existing**: Created before, linked during tracking
  - **Dynamic**: Created on-the-fly during tracking (flagged `is_dynamic = true`)
- Statistics differentiate existing vs dynamic tasks

### 3.3 Tasks

**Description**: One-off actions with optional project grouping.

**Attributes**:
- `title`, `description`
- `domain_id`: Link to domain
- `project_id`: Optional grouping
- `parent_task_id`: Subtask support
- `status`: backlog | todo | in_progress | blocked | done | cancelled | archived
- `priority`: high | medium | low
- `estimated_minutes`, `actual_minutes`
- `due_date`, `due_time`, `is_deadline_strict`

**Timer Feature**:
- Start/Pause/Stop timer
- Tracks `timer_started_at`, `timer_accumulated_seconds`, `timer_is_running`
- Compare estimated vs actual time

### 3.4 Projects

**Description**: Containers grouping related tasks toward a common goal.

**Attributes**:
- `name`, `description`
- `domain_id`: Link to domain
- `status`: active | paused | completed | archived
- `start_date`, `target_date`

**Features**:
- Automatic progress calculation (% tasks done)
- Gantt chart view (Kibo-UI Gantt)
- Task dependencies for Gantt visualization

**Task Dependencies** (for Gantt):
- `predecessor_id`, `successor_id`
- `dependency_type`: finish_to_start | start_to_start | finish_to_finish | start_to_finish
- `lag_days`: Delay between tasks

### 3.5 Tracking & Media

**Description**: Users can attach media to routine instances or tasks for memory and sharing.

**Supported Media**:
- Photos (image/*)
- Videos (video/*)
- Audio recordings (audio/*)
- Documents (application/pdf, etc.)

**Attributes**:
- `entity_type`: routine_instance | task
- `entity_id`: UUID of the entity
- `file_path`: Supabase Storage path
- `file_name`, `file_type`, `file_size`
- `media_category`: photo | video | audio | document | other
- `caption`: Optional description
- `thumbnail_path`: For video previews
- `duration_seconds`: For audio/video

### 3.6 Statistics

**Description**: Dashboard displaying key metrics and insights.

**Metrics**:
- Completion rate (routines, tasks)
- Time by domain (planned vs actual)
- Active streaks
- Tasks completed this week
- Dynamic vs existing task ratio

**Visualizations**:
- Domain time distribution (bar chart)
- Weekly completion trend (line chart)
- Streak leaderboard

---

## 4. User Interface Structure

### 4.1 Sidebar Navigation

```
VTT LABS
├── 🏠 Dashboard (global)
│
├── ─── LIFEOS ───────────
│   ├── 📅 Calendrier (default)
│   ├── 📋 Tâches
│   ├── 🔄 Routines
│   ├── 📁 Projets
│   └── 📊 Statistiques
│
├── ─── AUTRES MODULES ───
│   ├── 📦 Storage
│   └── ✅ Todo List
│
└── ─── CONFIGURATION ────
    ├── 🎨 Domaines de vie
    ├── ⚙️ Préférences
    └── 🔗 Intégrations (future)
```

### 4.2 Calendar Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ◀ Décembre 2025 ▶     [Jour] [Semaine●] [Mois]   [Aujourd'hui] [+Nouveau]│
├───────────────────────┬─────────────────────────────────────────────────┤
│  Mini-Calendar        │  Week/Month/Day View                            │
│  ──────────────────   │  (Kibo-UI Calendar customized)                  │
│  Filters:             │                                                 │
│  ☑ Routines           │                                                 │
│  ☑ Tâches             │                                                 │
│  ──────────────────   │                                                 │
│  By Domain:           │                                                 │
│  ☑ 💪 Santé           │                                                 │
│  ☑ 🚀 Carrière        │                                                 │
│  ...                  │                                                 │
│  ──────────────────   │                                                 │
│  ⚠️ Conflits (N)      │                                                 │
│  📋 Non planifié (N)  │                                                 │
└───────────────────────┴─────────────────────────────────────────────────┘
```

---

## 5. User Flows

### 5.1 Daily Usage

1. Open Calendar (week view by default)
2. See today's routines and tasks colored by domain
3. Click a routine instance → Modal opens
4. Mark as Done/Partial/Skipped
5. Optionally: Add actual value, mood, energy, notes
6. Optionally: Link tasks worked, attach media
7. Save → Streak updates, stats refresh

### 5.2 Planning New Items

1. Click "+ Nouveau" or empty calendar slot
2. Choose: Routine Template | Task | Quick Event
3. Fill form with domain, constraints, recurrence
4. Save → Instances auto-generated (routines) or task placed

### 5.3 Project Management

1. Navigate to Projects page
2. Create project with domain and dates
3. Add tasks to project
4. Set dependencies between tasks
5. View Gantt chart for timeline visualization

---

## 6. Non-Functional Requirements

- **UI/UX**: Clean, Notion Calendar-like interface. Shadcn UI + Kibo-UI components.
- **Performance**: Calendar navigation < 200ms. Instance generation < 1s.
- **Mobile**: Responsive design, touch-friendly.
- **Accessibility**: ARIA labels, keyboard navigation.
- **Architecture**: Next.js 15, Server Actions, Supabase RPC/Views per constitution.

---

## 7. Out of Scope (Phase 2+)

- AI-powered schedule generation
- Google Calendar sync
- OKR module
- Cross-module analytics
- Real-time collaboration
- Mobile native app

---

## 8. Success Criteria

1. User can view calendar in day/week/month views
2. User can create/edit/delete routine templates
3. Routine instances auto-generate for 14 days
4. User can track routine completion with optional media
5. User can link existing or dynamic tasks to routines
6. User can create tasks with timer functionality
7. User can group tasks into projects with Gantt view
8. User can filter calendar by routines/tasks and domains
9. Statistics page shows completion rates and streaks
10. Domains are managed in Configuration section

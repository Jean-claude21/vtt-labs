# Tasks: LifeOS Planning V2 (Calendar-Centric)

**Input**: Design documents from `/specs/001-lifeos-planning/`  
**Version**: 2.0.0 - Calendar-Centric Approach
**Last Updated**: 2025-12-06

**Key Change from V1**: AI scheduling is **SUSPENDED** for Phase 2+. MVP focuses on manual calendar-based planning with logical algorithms.

## Format: `[ID] [P?] [Status] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Status]**: ✅ Done, 🔄 In Progress, ⏳ Pending, ❌ Blocked

---

## Phase 1: Setup (Shared Infrastructure) ✅

**Purpose**: Project initialization, database schema, and folder structure

- [x] T001 Create database migration file in supabase/migrations/YYYYMMDD_lifeos_planning.sql with all tables
- [ ] T002 Apply migration and regenerate TypeScript types with `supabase db push && supabase gen types typescript`
- [x] T003 [P] Create module folder structure: src/features/lifeos/{components,actions,services,schema}
- [x] T004 [P] Create routing folder structure: src/app/app/lifeos/{domains,routines,tasks,projects}
- [x] T005 [P] Create module layout in src/app/app/lifeos/layout.tsx

---

## Phase 2: Foundation ✅

**Purpose**: Core schemas, services, and base components

### Zod Schemas ✅
- [x] T007 [P] Create domains Zod schema in src/features/lifeos/schema/domains.schema.ts
- [x] T008 [P] Create routines Zod schema in src/features/lifeos/schema/routines.schema.ts
- [x] T009 [P] Create tasks Zod schema in src/features/lifeos/schema/tasks.schema.ts
- [x] T010 [P] Create projects Zod schema in src/features/lifeos/schema/projects.schema.ts
- [x] T011 [P] Create planning Zod schema in src/features/lifeos/schema/planning.schema.ts
- [x] T012 [P] Create calendar Zod schema in src/features/lifeos/schema/calendar.schema.ts
- [x] T013 [P] Create media Zod schema in src/features/lifeos/schema/media.schema.ts
- [x] T014 [P] Create preferences Zod schema in src/features/lifeos/schema/preferences.schema.ts

### Navigation ✅
- [x] T015 Integrate LifeOS into global sidebar with submenu in src/components/app-sidebar.tsx
- [x] T016 Add Configuration section with Domaines de vie link

---

## Phase 3: Domains (Configuration) ✅

**Purpose**: Users can create, modify, delete, and reorder their life domains.

- [x] T020 Implement domains service with CRUD in src/features/lifeos/services/domains.service.ts
- [x] T021 Create domains Server Actions in src/features/lifeos/actions/domains.actions.ts
- [x] T022 [P] Create DomainCard component in src/features/lifeos/components/domains/domain-card.tsx
- [x] T023 [P] Create DomainForm component in src/features/lifeos/components/domains/domain-form.tsx
- [x] T024 Create DomainsList component in src/features/lifeos/components/domains/domains-list.tsx
- [x] T025 Create Settings/Domains page in src/app/app/lifeos/settings/page.tsx

---

## Phase 4: Calendar (Primary Interface) 🔄

**Purpose**: Interactive calendar displaying routines and tasks.

### Calendar Core ✅
- [x] T030 Create CalendarViewComponent with day/week/month in src/features/lifeos/components/calendar/calendar-view.tsx
- [x] T031 Create CalendarDashboard in src/app/app/lifeos/calendar-dashboard.tsx
- [x] T032 Create calendar service in src/features/lifeos/services/calendar.service.ts
- [x] T033 Create calendar actions in src/features/lifeos/actions/calendar.actions.ts
- [x] T034 Fix timeline to start from 00:00 (not 06:00)

### Calendar Enhancements ⏳
- [ ] T035 Add mini-calendar for quick date navigation
- [ ] T036 Add filters: Routines toggle, Tasks toggle
- [ ] T037 Add filters: Domain multi-select
- [ ] T038 Add current time indicator on timeline
- [ ] T039 Add conflict detection panel
- [ ] T040 Implement drag & drop for rescheduling

---

## Phase 5: Routines ✅

**Purpose**: Recurring activities with templates and instances.

- [x] T050 Implement routines service in src/features/lifeos/services/routines.service.ts
- [x] T051 Implement RRULE recurrence logic
- [x] T052 Create routines Server Actions in src/features/lifeos/actions/routines.actions.ts
- [x] T053 [P] Create RoutineCard component
- [x] T054 [P] Create RoutineForm component
- [x] T055 Create RoutinesList component
- [x] T056 Create Routines page in src/app/app/lifeos/routines/page.tsx

### Routine Instance Generation ✅
- [x] T057 Implement routine instance generation service
- [x] T058 Auto-generate instances for 14-day rolling horizon

### Routine Tracking ⏳
- [ ] T059 Create RoutineInstanceTracker modal component
- [ ] T060 Implement complete/skip with actual values
- [ ] T061 Add mood/energy/notes tracking
- [ ] T062 Implement streak calculation

---

## Phase 6: Tasks ✅

**Purpose**: One-off actions with optional project grouping.

- [x] T070 Implement tasks service in src/features/lifeos/services/tasks.service.ts
- [x] T071 Create tasks Server Actions in src/features/lifeos/actions/tasks.actions.ts
- [x] T072 [P] Create TaskCard component
- [x] T073 [P] Create TaskForm component
- [x] T074 Create TasksList component
- [x] T075 Create Tasks page in src/app/app/lifeos/tasks/page.tsx

### Task Timer ⏳
- [x] T076 Create timer service in src/features/lifeos/services/timer.service.ts
- [x] T077 Create timer actions in src/features/lifeos/actions/timer.actions.ts
- [ ] T078 Create TaskTimer component
- [ ] T079 Integrate timer into TaskCard

---

## Phase 7: Projects 🔄

**Purpose**: Containers grouping related tasks toward a common goal.

### Projects CRUD ⏳
- [ ] T080 Implement projects service in src/features/lifeos/services/projects.service.ts
- [x] T081 Create projects actions in src/features/lifeos/actions/projects.actions.ts
- [ ] T082 [P] Create ProjectCard component
- [ ] T083 [P] Create ProjectForm component
- [ ] T084 Create ProjectsList component
- [x] T085 Create Projects page in src/app/app/lifeos/projects/page.tsx

### Gantt View ⏳
- [x] T086 Create dependencies service in src/features/lifeos/services/dependencies.service.ts
- [ ] T087 Integrate Kibo-UI Gantt component
- [ ] T088 Implement task dependencies for Gantt

---

## Phase 8: Media Attachments 🔄

**Purpose**: Users can attach media to routine instances or tasks.

- [x] T090 Create media service in src/features/lifeos/services/media.service.ts
- [x] T091 Create media actions in src/features/lifeos/actions/media.actions.ts
- [x] T092 Create Media page in src/app/app/lifeos/media/page.tsx
- [x] T093 Create MediaDashboard component

### Media Upload ⏳
- [ ] T094 Implement file upload to Supabase Storage
- [ ] T095 Create MediaUpload component
- [ ] T096 Create MediaGallery component with thumbnails
- [ ] T097 Link media to routine instances and tasks

---

## Phase 9: Statistics 🔄

**Purpose**: Dashboard displaying key metrics and insights.

- [x] T100 Create Statistics page in src/app/app/lifeos/stats/page.tsx
- [x] T101 Create StatsDashboard component

### Statistics Implementation ⏳
- [ ] T102 Create analytics service in src/features/lifeos/services/analytics.service.ts
- [ ] T103 Create analytics actions in src/features/lifeos/actions/analytics.actions.ts
- [ ] T104 Implement completion rate calculation
- [ ] T105 Implement time by domain aggregation
- [ ] T106 Implement streak leaderboard
- [ ] T107 Create CompletionChart component
- [ ] T108 Create DomainTimeChart component
- [ ] T109 Create StreaksList component

---

## Phase 10: Preferences 🔄

**Purpose**: User preferences for calendar and LifeOS behavior.

- [x] T110 Create preferences schema in src/features/lifeos/schema/preferences.schema.ts
- [x] T111 Create preferences service in src/features/lifeos/services/preferences.service.ts
- [x] T112 Create preferences actions in src/features/lifeos/actions/preferences.actions.ts

### Preferences UI ⏳
- [ ] T113 Create Preferences tab in Settings page
- [ ] T114 Add default view preference (day/week/month)
- [ ] T115 Add wake/sleep time preferences
- [ ] T116 Add hidden domains toggle

---

## Phase 11: Polish & Integration ⏳

**Purpose**: Final touches and cross-cutting concerns.

- [ ] T120 Add loading skeletons for all list components
- [ ] T121 Add empty states for all pages
- [ ] T122 Add error handling with toast notifications
- [ ] T123 Responsive design adjustments for mobile
- [ ] T124 Keyboard navigation support
- [ ] T125 Performance optimization

---

## Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Setup | ✅ Done | 5/6 (T002 pending) |
| Phase 2: Foundation | ✅ Done | 10/10 |
| Phase 3: Domains | ✅ Done | 6/6 |
| Phase 4: Calendar | 🔄 In Progress | 5/11 |
| Phase 5: Routines | 🔄 In Progress | 8/12 |
| Phase 6: Tasks | 🔄 In Progress | 7/10 |
| Phase 7: Projects | 🔄 In Progress | 3/9 |
| Phase 8: Media | 🔄 In Progress | 4/8 |
| Phase 9: Statistics | 🔄 In Progress | 2/10 |
| Phase 10: Preferences | 🔄 In Progress | 3/7 |
| Phase 11: Polish | ⏳ Pending | 0/6 |

**Overall Progress**: ~55% Complete

---

## Next Priority Tasks

1. **T002** - Apply migration and regenerate types
2. **T035-T040** - Calendar enhancements (filters, mini-calendar, drag&drop)
3. **T059-T062** - Routine tracking modal
4. **T078-T079** - Task timer UI
5. **T094-T097** - Media upload functionality

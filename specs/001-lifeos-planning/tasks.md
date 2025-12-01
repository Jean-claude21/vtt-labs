# Tasks: LifeOS Planning V1

**Input**: Design documents from `/specs/001-lifeos-planning/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: NOT REQUESTED — No test tasks included. Focus on implementation only.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3...)
- All paths are relative to repository root

## User Story Mapping

| Story | Priority | Title |
|-------|----------|-------|
| US1 | P1 | Configurer mes Domaines de Vie |
| US2 | P1 | Créer et Gérer mes Routines |
| US3 | P1 | Créer et Gérer mes Tâches |
| US4 | P2 | Créer et Gérer mes Projets |
| US5 | P1 | Générer mon Planning Quotidien |
| US6 | P1 | Visualiser mon Planning en Timeline |
| US7 | P1 | Tracker l'Exécution de mes Routines |
| US8 | P2 | Tracker l'Exécution de mes Tâches |
| US9 | P2 | Lier Tâches aux Routines de Travail |
| US10 | P2 | Voir mes Statistiques de Base |
| US11 | P2 | Ajuster mon Planning Manuellement |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, database schema, and folder structure

- [X] T001 Create database migration file in supabase/migrations/YYYYMMDD_lifeos_planning.sql with all 9 tables from data-model.md
- [ ] T002 Apply migration and regenerate TypeScript types with `npx supabase db push && npx supabase gen types typescript`
- [X] T003 [P] Create module folder structure: src/features/lifeos/{components,actions,services,schema} with subfolders
- [X] T004 [P] Create routing folder structure: src/app/app/lifeos/{domains,routines,tasks,projects,analytics}
- [X] T005 [P] Create module layout in src/app/app/lifeos/layout.tsx with teal-500 accent color
- [ ] T006 Add OPENAI_API_KEY to .env.example and environment configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas, services, and base components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared Types & Schemas

- [X] T007 [P] Create domains Zod schema in src/features/lifeos/schema/domains.schema.ts
- [X] T008 [P] Create routines Zod schema in src/features/lifeos/schema/routines.schema.ts
- [X] T009 [P] Create tasks Zod schema in src/features/lifeos/schema/tasks.schema.ts
- [X] T010 [P] Create projects Zod schema in src/features/lifeos/schema/projects.schema.ts
- [X] T011 [P] Create planning Zod schema in src/features/lifeos/schema/planning.schema.ts

### Navigation Integration

- [X] T012 Add LifeOS module to sidebar navigation in src/components/app-sidebar.tsx with teal-500 icon

**Checkpoint**: Foundation ready — User story implementation can now begin

---

## Phase 3: User Story 1 — Configurer mes Domaines de Vie (Priority: P1) 🎯 MVP

**Goal**: Users can create, modify, delete, and reorder their life domains. 8 default domains are seeded on first access.

**Independent Test**: Navigate to /app/lifeos/domains → See 8 default domains with icons/colors → Create a new domain → Edit → Delete (if no linked items)

### Implementation for User Story 1

- [X] T013 [US1] Implement domains service with CRUD operations in src/features/lifeos/services/domains.service.ts
- [X] T014 [US1] Implement seed default domains function in src/features/lifeos/services/domains.service.ts (8 predefined domains)
- [X] T015 [US1] Create getDomains, getDomain, createDomain, updateDomain, deleteDomain, reorderDomains Server Actions in src/features/lifeos/actions/domains.actions.ts
- [X] T016 [US1] Create seedDefaultDomains Server Action in src/features/lifeos/actions/domains.actions.ts
- [X] T017 [P] [US1] Create DomainCard component in src/features/lifeos/components/domains/domain-card.tsx
- [X] T018 [P] [US1] Create DomainForm component (create/edit) in src/features/lifeos/components/domains/domain-form.tsx
- [X] T019 [US1] Create DomainsList component with reordering in src/features/lifeos/components/domains/domains-list.tsx
- [X] T020 [US1] Create Domains page with empty state + auto-seed in src/app/app/lifeos/domains/page.tsx

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 — Créer et Gérer mes Routines (Priority: P1)

**Goal**: Users can create routine templates with flexible constraints (duration, time slot, target value). Supports multiple recurrence patterns.

**Independent Test**: Navigate to /app/lifeos/routines → Create routine with domain, categories, constraints → Edit constraints → View routine list with streak indicators

### Implementation for User Story 2

- [X] T021 [US2] Implement routines service with CRUD for templates in src/features/lifeos/services/routines.service.ts
- [X] T022 [US2] Implement constraints parsing (duration, time slot, target value) in src/features/lifeos/services/routines.service.ts
- [X] T023 [US2] Implement RRULE recurrence logic (daily, specific days, weekly, monthly) in src/features/lifeos/services/routines.service.ts
- [X] T024 [US2] Create getRoutines, getRoutine, createRoutine, updateRoutine, deleteRoutine Server Actions in src/features/lifeos/actions/routines.actions.ts
- [X] T025 [P] [US2] Create RoutineCard component with streak badge in src/features/lifeos/components/routines/routine-card.tsx
- [X] T026 [P] [US2] Create RoutineForm component with constraints UI in src/features/lifeos/components/routines/routine-form.tsx
- [X] T027 [US2] Create RoutinesList component with filters by domain/category in src/features/lifeos/components/routines/routines-list.tsx
- [X] T028 [US2] Create Routines page in src/app/app/lifeos/routines/page.tsx

**Checkpoint**: User Story 2 is fully functional and independently testable

---

## Phase 5: User Story 3 — Créer et Gérer mes Tâches (Priority: P1)

**Goal**: Users can create tasks with priority, duration estimation, optional project assignment, and deadline.

**Independent Test**: Navigate to /app/lifeos/tasks → Create task with title, domain, priority → Mark status changes (TODO→IN_PROGRESS→DONE) → Filter by domain/project

### Implementation for User Story 3

- [X] T029 [US3] Implement tasks service with CRUD and status transitions in src/features/lifeos/services/tasks.service.ts
- [X] T030 [US3] Implement task filtering (by domain, project, status, priority) in src/features/lifeos/services/tasks.service.ts
- [X] T031 [US3] Create getTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus Server Actions in src/features/lifeos/actions/tasks.actions.ts
- [X] T032 [P] [US3] Create TaskCard component with priority badge in src/features/lifeos/components/tasks/task-card.tsx
- [X] T033 [P] [US3] Create TaskForm component with deadline options in src/features/lifeos/components/tasks/task-form.tsx
- [X] T034 [US3] Create TasksList component with filters and sorting in src/features/lifeos/components/tasks/tasks-list.tsx
- [X] T035 [US3] Create Tasks page in src/app/app/lifeos/tasks/page.tsx

**Checkpoint**: User Story 3 is fully functional and independently testable

---

## Phase 6: User Story 4 — Créer et Gérer mes Projets (Priority: P2)

**Goal**: Users can group tasks into projects with automatic progress calculation.

**Independent Test**: Navigate to /app/lifeos/projects → Create project with domain → Add tasks → See progress percentage → Archive project

### Implementation for User Story 4

- [ ] T036 [US4] Implement projects service with CRUD and progress calculation in src/features/lifeos/services/projects.service.ts
- [ ] T037 [US4] Create getProjects, getProject, createProject, updateProject, archiveProject, deleteProject Server Actions in src/features/lifeos/actions/projects.actions.ts
- [ ] T038 [P] [US4] Create ProjectCard component with progress bar in src/features/lifeos/components/projects/project-card.tsx
- [ ] T039 [P] [US4] Create ProjectForm component in src/features/lifeos/components/projects/project-form.tsx
- [ ] T040 [US4] Create ProjectsList component with status filters in src/features/lifeos/components/projects/projects-list.tsx
- [ ] T041 [US4] Create Projects page in src/app/app/lifeos/projects/page.tsx
- [ ] T042 [US4] Update TaskForm to allow project selection in src/features/lifeos/components/tasks/task-form.tsx

**Checkpoint**: User Story 4 is fully functional and independently testable

---

## Phase 7: User Story 5 — Générer mon Planning Quotidien (Priority: P1)

**Goal**: AI generates daily plan by placing routines (fixed first, then flexible) and tasks in available slots with reasoning.

**Independent Test**: Click "Generate Plan" for a date → AI places all scheduled routines → Tasks fill remaining slots → Each slot shows AI reasoning

### Implementation for User Story 5

- [X] T043 [US5] Implement routine instance generation service in src/features/lifeos/services/routine-instances.service.ts
- [X] T044 [US5] Implement OpenAI scheduling integration in src/features/lifeos/services/ai/scheduler.ai.ts
- [X] T045 [US5] Implement planning service (slot generation, conflict detection) in src/features/lifeos/services/planning.service.ts
- [X] T046 [US5] Create generatePlan, regeneratePlan Server Actions in src/features/lifeos/actions/planning.actions.ts
- [X] T047 [US5] Create getPlanForDate, getPlanSlots Server Actions in src/features/lifeos/actions/planning.actions.ts
- [X] T048 [P] [US5] Create GeneratePlanButton component in src/features/lifeos/components/planning/generate-plan-button.tsx
- [X] T049 [P] [US5] Create DayNavigator component in src/features/lifeos/components/planning/day-navigator.tsx

**Checkpoint**: User Story 5 is fully functional and independently testable

---

## Phase 8: User Story 6 — Visualiser mon Planning en Timeline (Priority: P1)

**Goal**: Users see their daily plan as a vertical timeline with colored slots by domain, current time indicator, and day navigation.

**Independent Test**: Navigate to /app/lifeos → See vertical timeline → Slots colored by domain → Click slot to see details → Navigate between days

### Implementation for User Story 6

- [X] T050 [US6] Create PlanSlot component with domain coloring in src/features/lifeos/components/planning/plan-slot.tsx
- [X] T051 [US6] Create TimelineView component with hours grid in src/features/lifeos/components/planning/timeline-view.tsx
- [X] T052 [US6] Create SlotDetailsModal component showing AI reasoning in src/features/lifeos/components/planning/slot-details-modal.tsx
- [X] T053 [US6] Create CurrentTimeIndicator component in src/features/lifeos/components/planning/current-time-indicator.tsx
- [X] T054 [US6] Create main Planning page (dashboard) in src/app/app/lifeos/page.tsx

**Checkpoint**: User Story 6 is fully functional and independently testable

---

## Phase 9: User Story 7 — Tracker l'Exécution de mes Routines (Priority: P1)

**Goal**: Users can mark routine instances as done/skipped with actual values, and streaks are maintained automatically.

**Independent Test**: Click "Done" on a routine → Enter actual value → See completion score → Streak counter increments → Skip with reason

### Implementation for User Story 7

- [X] T055 [US7] Implement streak service (update, reset, calculate) in src/features/lifeos/services/streaks.service.ts
- [X] T056 [US7] Implement completeRoutineInstance with score calculation in src/features/lifeos/services/routine-instances.service.ts
- [X] T057 [US7] Implement skipRoutineInstance with reason in src/features/lifeos/services/routine-instances.service.ts
- [X] T058 [US7] Create completeRoutineInstance, skipRoutineInstance Server Actions in src/features/lifeos/actions/routines.actions.ts
- [X] T059 [US7] Create RoutineInstanceTracker component in src/features/lifeos/components/routines/routine-instance-tracker.tsx
- [X] T060 [US7] Create CompletionModal component with value input and mood/energy in src/features/lifeos/components/routines/completion-modal.tsx
- [X] T061 [US7] Integrate tracker into timeline slots in src/features/lifeos/components/planning/plan-slot.tsx

**Checkpoint**: User Story 7 is fully functional and independently testable

---

## Phase 10: User Story 8 — Tracker l'Exécution de mes Tâches (Priority: P2)

**Goal**: Users can track time spent on tasks with a timer, comparing estimated vs actual duration.

**Independent Test**: Start timer on task → Pause/resume → Stop → See actual time recorded → Compare to estimate

### Implementation for User Story 8

- [ ] T062 [US8] Implement task time tracking in src/features/lifeos/services/tasks.service.ts
- [ ] T063 [US8] Create startTaskTimer, pauseTaskTimer, stopTaskTimer Server Actions in src/features/lifeos/actions/tasks.actions.ts
- [ ] T064 [US8] Create TaskTimer component in src/features/lifeos/components/tasks/task-timer.tsx
- [ ] T065 [US8] Integrate timer into TaskCard component in src/features/lifeos/components/tasks/task-card.tsx

**Checkpoint**: User Story 8 is fully functional and independently testable

---

## Phase 11: User Story 9 — Lier Tâches aux Routines de Travail (Priority: P2)

**Goal**: Users can associate tasks worked during a work routine to validate both the routine and track task progress.

**Independent Test**: Complete a "Deep Work" routine → Select tasks worked → Enter time per task → See tasks reflected in routine history

### Implementation for User Story 9

- [ ] T066 [US9] Implement routine-task linking service in src/features/lifeos/services/routine-instances.service.ts
- [ ] T067 [US9] Create linkTasksToRoutine Server Action in src/features/lifeos/actions/routines.actions.ts
- [ ] T068 [US9] Create TaskLinkingModal component in src/features/lifeos/components/routines/task-linking-modal.tsx
- [ ] T069 [US9] Update CompletionModal to show task linking option for work routines in src/features/lifeos/components/routines/completion-modal.tsx

**Checkpoint**: User Story 9 is fully functional and independently testable

---

## Phase 12: User Story 10 — Voir mes Statistiques de Base (Priority: P2)

**Goal**: Users see completion rates, streaks list, and time distribution by domain (planned vs actual).

**Independent Test**: Navigate to /app/lifeos/analytics → See weekly completion rate → See all streaks → See domain time chart

### Implementation for User Story 10

- [ ] T070 [US10] Implement analytics service (completion rates, time aggregation) in src/features/lifeos/services/analytics.service.ts
- [ ] T071 [US10] Create getDailyAnalytics, getWeeklyAnalytics, getStreaks Server Actions in src/features/lifeos/actions/analytics.actions.ts
- [ ] T072 [P] [US10] Create CompletionChart component in src/features/lifeos/components/analytics/completion-chart.tsx
- [ ] T073 [P] [US10] Create StreaksList component in src/features/lifeos/components/analytics/streaks-list.tsx
- [ ] T074 [P] [US10] Create DomainTimeChart component (planned vs actual) in src/features/lifeos/components/analytics/domain-time-chart.tsx
- [ ] T075 [US10] Create Analytics page in src/app/app/lifeos/analytics/page.tsx

**Checkpoint**: User Story 10 is fully functional and independently testable

---

## Phase 13: User Story 11 — Ajuster mon Planning Manuellement (Priority: P2)

**Goal**: Users can drag-drop flexible slots to new times and delete slots from the plan.

**Independent Test**: Drag a flexible slot to new time → Slot moves → Try moving fixed slot → Blocked → Delete a slot → Time freed

### Implementation for User Story 11

- [ ] T076 [US11] Implement movePlanSlot, deletePlanSlot in src/features/lifeos/services/planning.service.ts
- [ ] T077 [US11] Create movePlanSlot, deletePlanSlot Server Actions in src/features/lifeos/actions/planning.actions.ts
- [ ] T078 [US11] Add drag-drop functionality to TimelineView in src/features/lifeos/components/planning/timeline-view.tsx
- [ ] T079 [US11] Add delete option to SlotDetailsModal in src/features/lifeos/components/planning/slot-details-modal.tsx

**Checkpoint**: User Story 11 is fully functional and independently testable

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Final touches and validation across all stories

- [ ] T080 [P] Add loading skeletons for all list components
- [ ] T081 [P] Add empty states for domains, routines, tasks, projects, analytics
- [ ] T082 [P] Add error handling with toast notifications across all actions
- [ ] T083 Implement responsive design adjustments for mobile viewport
- [ ] T084 Run quickstart.md validation checklist
- [ ] T085 Performance audit: Ensure planning generation < 10s, UI interactions < 100ms

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────┐
                             ├──► Phase 2: Foundational ──┐
                             │                            │
                             │    ┌───────────────────────┼───────────────────────┐
                             │    │                       │                       │
                             │    ▼                       ▼                       ▼
                             │  Phase 3: US1          Phase 4: US2          Phase 5: US3
                             │  (Domains)             (Routines)            (Tasks)
                             │    │                       │                       │
                             │    │                       └───────┬───────────────┘
                             │    │                               │
                             │    │                               ▼
                             │    │                         Phase 6: US4
                             │    │                         (Projects)
                             │    │                               │
                             │    └───────────────┬───────────────┘
                             │                    │
                             │                    ▼
                             │              Phase 7: US5 ──► Phase 8: US6
                             │              (AI Planning)    (Timeline View)
                             │                    │
                             │                    ▼
                             │              Phase 9: US7 ──► Phase 10: US8
                             │              (Routine Track)  (Task Track)
                             │                    │
                             │                    ▼
                             │              Phase 11: US9
                             │              (Task-Routine Link)
                             │                    │
                             │                    ▼
                             │              Phase 12: US10 ──► Phase 13: US11
                             │              (Analytics)       (Manual Adjust)
                             │                    │
                             │                    ▼
                             └──────────────► Phase 14: Polish
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Domains) | Foundational | Phase 2 complete |
| US2 (Routines) | US1 (needs domains) | US1 complete |
| US3 (Tasks) | US1 (needs domains) | US1 complete |
| US4 (Projects) | US1, US3 (needs domains + tasks) | US3 complete |
| US5 (AI Planning) | US1, US2, US3 | US2 + US3 complete |
| US6 (Timeline) | US5 (needs generated plan) | US5 complete |
| US7 (Routine Track) | US5, US6 (needs timeline) | US6 complete |
| US8 (Task Track) | US3, US7 | US7 complete |
| US9 (Task-Routine Link) | US7, US8 | US7 complete |
| US10 (Analytics) | US7 (needs tracking data) | US7 complete |
| US11 (Manual Adjust) | US6 (needs timeline) | US6 complete |

### Parallel Opportunities Per Phase

**Phase 1 (Setup)**:
```bash
# Can run in parallel (T003, T004, T005, T006):
T003: Create module folder structure
T004: Create routing folder structure
T005: Create module layout
T006: Add OPENAI_API_KEY to .env.example
```

**Phase 2 (Foundational)**:
```bash
# All Zod schemas in parallel (T007-T011):
T007: domains.schema.ts
T008: routines.schema.ts
T009: tasks.schema.ts
T010: projects.schema.ts
T011: planning.schema.ts
```

**Phase 3 (US1 - Domains)**:
```bash
# Components in parallel (T017, T018):
T017: DomainCard component
T018: DomainForm component
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 + 5-7)

1. **Complete Phase 1**: Setup (T001-T006)
2. **Complete Phase 2**: Foundational schemas (T007-T012)
3. **Complete Phase 3**: User Story 1 - Domains
4. **Complete Phase 4**: User Story 2 - Routines
5. **Complete Phase 5**: User Story 3 - Tasks
6. **Complete Phase 7**: User Story 5 - AI Planning
7. **Complete Phase 8**: User Story 6 - Timeline View
8. **Complete Phase 9**: User Story 7 - Routine Tracking
9. **STOP and VALIDATE**: Core loop is complete (plan → view → track)
10. Deploy MVP

### Incremental Delivery After MVP

1. Add US4 (Projects) — Groups tasks
2. Add US8 (Task Tracking) — Timer feature
3. Add US9 (Task-Routine Link) — Advanced tracking
4. Add US10 (Analytics) — Dashboard metrics
5. Add US11 (Manual Adjust) — Drag-drop planning
6. Complete Phase 14 (Polish)

---

## Notes

- **[P] tasks**: Different files, no dependencies — can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Commit strategy**: Commit after each completed task or logical group
- **Validation checkpoints**: Stop at each story checkpoint to validate independently
- **File paths**: All relative to repository root
- **Color theme**: Module uses `teal-500` (#14B8A6) accent throughout

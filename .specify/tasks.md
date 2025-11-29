# Intelligent Personal Planning Engine: Implementation Tasks

This document breaks down the `plan.md` into a checklist of atomic, verifiable tasks for implementation.

---

## Phase 1: Database & Core Setup

### 1.1 Supabase Schema
- [ ] **Task 1**: Write and execute the SQL migration script to create the `domains` table.
- [ ] **Task 2**: Write and execute the SQL migration script to create the `routines` table.
- [ ] **Task 3**: Write and execute the SQL migration script to create the `tasks` table.
- [ ] **Task 4**: Write and execute the SQL migration script to create the `schedule` table.

### 1.2 Supabase RPC Functions
- [ ] **Task 5**: Implement and test the `create_domain` RPC function.
- [ ] **Task 6**: Implement and test the `update_domain` RPC function.
- [ ] **Task 7**: Implement and test the `delete_domain` RPC function.
- [ ] **Task 8**: Implement and test the `create_routine` RPC function.
- [ ] **Task 9**: Implement and test the `update_routine` RPC function.
- [ ] **Task 10**: Implement and test the `delete_routine` RPC function.
- [ ] **Task 11**: Implement and test the `create_task` RPC function.
- [ ] **Task 12**: Implement and test the `update_task` RPC function.
- [ ] **Task 13**: Implement and test the `delete_task` RPC function.
- [ ] **Task 14**: Implement and test the `update_schedule_item_status` RPC function.

---

## Phase 2: Feature Implementation - Domains

### 2.1 Backend
- [ ] **Task 15**: Create `features/domains/schema/domainSchema.ts` with Zod schemas for domain creation and updates.
- [ ] **Task 16**: Create `features/domains/actions/domainActions.ts` with Server Actions for `create`, `update`, and `delete` operations, using the Zod schemas for validation.

### 2.2 Frontend
- [ ] **Task 17**: Create the `features/domains/components/DomainForm.tsx` component for creating and editing domains.
- [ ] **Task 18**: Create the `features/domains/components/DomainList.tsx` component to display, edit, and delete existing domains.
- [ ] **Task 19**: Create the `app/settings/page.tsx` and integrate the `DomainList` and `DomainForm` components.

---

## Phase 3: Feature Implementation - Routines & Tasks

### 3.1 Backend
- [ ] **Task 20**: Create `features/routines/schema/routineSchema.ts` and `features/tasks/schema/taskSchema.ts`.
- [ ] **Task 21**: Create `features/routines/actions/routineActions.ts` and `features/tasks/actions/taskActions.ts` with Server Actions for CRUD operations.

### 3.2 Frontend
- [ ] **Task 22**: Create `features/routines/components/RoutineForm.tsx` and `features/tasks/components/TaskForm.tsx`.
- [ ] **Task 23**: Create `features/routines/components/RoutineList.tsx` and `features/tasks/components/TaskList.tsx`.
- [ ] **Task 24**: Add the new list and form components to the `app/settings/page.tsx`.

---

## Phase 4: Core Engine - Calendar Sync & Schedule Generation

### 4.1 Calendar Sync
- [ ] **Task 25**: Implement the Google Calendar OAuth flow using `@next/third-parties`.
- [ ] **Task 26**: Create `features/calendar-sync/services/googleCalendar.ts` to fetch calendar events.
- [ ] **Task 27**: Create `features/calendar-sync/components/GoogleCalendarConnectButton.tsx` and add it to the settings page.

### 4.2 Schedule Generator
- [ ] **Task 28**: Implement the core `generate_schedule` Supabase RPC function. This function will:
    - Load user's availability.
    - Fetch and place external Google Calendar events.
    - Place routines in preferred slots.
    - Place tasks in remaining slots.
- [ ] **Task 29**: Create `features/schedule-generator/actions/scheduleActions.ts` to call the `generate_schedule` RPC.
- [ ] **Task 30**: Create `features/schedule-generator/components/GenerateScheduleButton.tsx` and add it to the dashboard.

---

## Phase 5: UI & User Interaction

### 5.1 Schedule Display
- [ ] **Task 31**: Create `features/schedule-generator/components/ScheduleView.tsx` to display the generated schedule.
- [ ] **Task 32**: Implement a calendar or timeline view within `ScheduleView.tsx`.
- [ ] **Task 33**: Integrate `ScheduleView.tsx` into `app/dashboard/page.tsx`.

### 5.2 Execution Tracking
- [ ] **Task 34**: Create `features/execution-tracker/components/ScheduleItem.tsx` with controls to mark items as 'done', 'skipped', etc.
- [ ] **Task 35**: Create `features/execution-tracker/actions/trackerActions.ts` to call the `update_schedule_item_status` RPC.
- [ ] **Task 36**: Integrate the status update functionality into `ScheduleItem.tsx`.

### 5.3 Statistics
- [ ] **Task 37**: Create Supabase Views to aggregate data for the statistics dashboard.
- [ ] **Task 38**: Create `features/statistics/services/statistics.ts` to fetch data from the views.
- [ ] **Task 39**: Create `features/statistics/components/TimeDistributionChart.tsx` and `CompletionRateChart.tsx` using `recharts`.
- [ ] **Task 40**: Integrate the chart components into `app/statistics/page.tsx`.

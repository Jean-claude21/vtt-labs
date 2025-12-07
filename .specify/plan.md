# LifeOS Planning Module: Technical Plan V2

> **Version**: 2.0.0  
> **Date**: 2025-12-06  
> **Input**: spec.md V2

This document translates the functional requirements from `spec.md` into a technical blueprint, adhering to the principles defined in `constitution.md`.

---

## 1. Architecture Overview

### 1.1 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 15.x |
| **Runtime** | React | 19.x |
| **Language** | TypeScript | 5.x (strict) |
| **Database** | Supabase Postgres | Latest |
| **Auth** | Supabase Auth | Latest |
| **UI Library** | Shadcn UI + Kibo-UI | Latest |
| **Styling** | TailwindCSS | 4.x |
| **Validation** | Zod | 3.x |
| **Calendar** | Kibo-UI Calendar | Latest |
| **Gantt** | Kibo-UI Gantt | Latest |
| **State** | Jotai (for calendar) | Latest |

### 1.2 External Dependencies (New)

```bash
# Kibo-UI Components
npx kibo-ui add calendar
npx kibo-ui add mini-calendar
npx kibo-ui add gantt

# Additional
pnpm add date-fns rrule
```

---

## 2. Database Schema

### 2.1 Existing Tables (No Changes)

- `lifeos_domains` ✅
- `lifeos_projects` ✅
- `lifeos_routine_templates` ✅
- `lifeos_routine_instances` ✅
- `lifeos_streaks` ✅
- `lifeos_generated_plans` ✅ (suspended, keep for future)
- `lifeos_plan_slots` ✅ (suspended, keep for future)

### 2.2 Modified Tables

#### `lifeos_tasks` (Add Timer Columns)

```sql
ALTER TABLE lifeos_tasks ADD COLUMN IF NOT EXISTS 
  timer_started_at TIMESTAMPTZ,
  timer_accumulated_seconds INTEGER DEFAULT 0,
  timer_is_running BOOLEAN DEFAULT false;
```

#### `lifeos_routine_instance_tasks` (Add Dynamic Flag)

```sql
ALTER TABLE lifeos_routine_instance_tasks ADD COLUMN IF NOT EXISTS 
  is_dynamic BOOLEAN DEFAULT false;
```

### 2.3 New Tables

#### `lifeos_tracking_media`

```sql
CREATE TABLE lifeos_tracking_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'routine_instance' | 'task' | extensible
  entity_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  media_category TEXT CHECK (media_category IN ('photo', 'video', 'audio', 'document', 'other')),
  caption TEXT,
  thumbnail_path TEXT,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lifeos_tracking_media_user ON lifeos_tracking_media(user_id);
CREATE INDEX idx_lifeos_tracking_media_entity ON lifeos_tracking_media(entity_type, entity_id);

-- RLS
ALTER TABLE lifeos_tracking_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own media" ON lifeos_tracking_media
  FOR ALL USING (user_id = auth.uid());
```

#### `lifeos_task_dependencies`

```sql
CREATE TABLE lifeos_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES lifeos_tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES lifeos_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' 
    CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(predecessor_id, successor_id),
  CHECK (predecessor_id != successor_id)
);

-- Indexes
CREATE INDEX idx_lifeos_task_deps_predecessor ON lifeos_task_dependencies(predecessor_id);
CREATE INDEX idx_lifeos_task_deps_successor ON lifeos_task_dependencies(successor_id);

-- RLS (via task ownership)
ALTER TABLE lifeos_task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own task dependencies" ON lifeos_task_dependencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM lifeos_tasks t WHERE t.id = predecessor_id AND t.user_id = auth.uid())
  );
```

#### `lifeos_user_preferences`

```sql
CREATE TABLE lifeos_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Calendar preferences
  default_calendar_view TEXT DEFAULT 'week' CHECK (default_calendar_view IN ('day', 'week', 'month')),
  week_starts_on INTEGER DEFAULT 1 CHECK (week_starts_on BETWEEN 0 AND 6),
  
  -- Display filters (saved state)
  show_routines BOOLEAN DEFAULT true,
  show_tasks BOOLEAN DEFAULT true,
  show_external_events BOOLEAN DEFAULT true,
  hidden_domain_ids UUID[] DEFAULT '{}',
  
  -- Planning
  routine_generation_horizon_days INTEGER DEFAULT 14,
  
  -- Extensible
  preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE lifeos_user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON lifeos_user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Trigger
CREATE TRIGGER update_lifeos_user_preferences_updated_at
  BEFORE UPDATE ON lifeos_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. File Structure

### 3.1 App Routes

```
src/app/
├── app/
│   ├── lifeos/
│   │   ├── layout.tsx              # LifeOS layout (teal accent)
│   │   ├── page.tsx                # Redirects to /calendar
│   │   ├── calendar/
│   │   │   └── page.tsx            # 📅 Main calendar view
│   │   ├── tasks/
│   │   │   └── page.tsx            # 📋 Task list/board
│   │   ├── routines/
│   │   │   └── page.tsx            # 🔄 Routine templates
│   │   ├── projects/
│   │   │   ├── page.tsx            # 📁 Projects list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Project detail + Gantt
│   │   └── statistics/
│   │       └── page.tsx            # 📊 Stats dashboard
│   │
│   └── settings/
│       ├── domains/
│       │   └── page.tsx            # 🎨 Domains management
│       └── preferences/
│           └── page.tsx            # ⚙️ User preferences
```

### 3.2 Feature Structure

```
src/features/lifeos/
├── actions/
│   ├── domains.actions.ts          ✅ Exists
│   ├── routines.actions.ts         ✅ Exists (update for generation)
│   ├── tasks.actions.ts            ✅ Exists (add timer actions)
│   ├── projects.actions.ts         🆕 Create
│   ├── media.actions.ts            🆕 Create
│   ├── preferences.actions.ts      🆕 Create
│   └── planning.actions.ts         ✅ Exists (suspend AI, keep algo)
│
├── services/
│   ├── domains.service.ts          ✅ Exists
│   ├── routines.service.ts         ✅ Exists
│   ├── routine-instances.service.ts ✅ Exists (update generation)
│   ├── tasks.service.ts            ✅ Exists (add timer logic)
│   ├── projects.service.ts         🆕 Create
│   ├── media.service.ts            🆕 Create
│   ├── preferences.service.ts      🆕 Create
│   └── calendar.service.ts         🆕 Create (data aggregation)
│
├── schema/
│   ├── domains.schema.ts           ✅ Exists
│   ├── routines.schema.ts          ✅ Exists
│   ├── tasks.schema.ts             ✅ Exists (add timer fields)
│   ├── projects.schema.ts          ✅ Exists (add dependencies)
│   ├── media.schema.ts             🆕 Create
│   ├── preferences.schema.ts       🆕 Create
│   └── calendar.schema.ts          🆕 Create
│
└── components/
    ├── calendar/                   🆕 Create
    │   ├── calendar-view.tsx       # Main calendar wrapper
    │   ├── week-view.tsx           # Week grid
    │   ├── month-view.tsx          # Month grid
    │   ├── day-view.tsx            # Day timeline (reuse existing)
    │   ├── calendar-event.tsx      # Single event display
    │   ├── calendar-sidebar.tsx    # Filters + mini-calendar
    │   ├── calendar-header.tsx     # Navigation + view toggle
    │   └── event-modal.tsx         # Create/edit modal
    │
    ├── domains/                    ✅ Exists (move to settings)
    │
    ├── routines/                   ✅ Exists
    │   └── task-linking-modal.tsx  🆕 Create
    │
    ├── tasks/                      ✅ Exists
    │   └── task-timer.tsx          🆕 Create
    │
    ├── projects/                   🆕 Create
    │   ├── project-card.tsx
    │   ├── project-form.tsx
    │   ├── projects-list.tsx
    │   └── project-gantt.tsx       # Kibo-UI Gantt wrapper
    │
    ├── media/                      🆕 Create
    │   ├── media-uploader.tsx
    │   ├── media-gallery.tsx
    │   └── media-preview.tsx
    │
    └── statistics/                 🆕 Create
        ├── stats-overview.tsx
        ├── domain-time-chart.tsx
        ├── completion-chart.tsx
        └── streaks-list.tsx
```

---

## 4. Component Mapping

### 4.1 Kibo-UI Components to Install

| Component | Usage |
|-----------|-------|
| `@kibo-ui/calendar` | Month view base |
| `@kibo-ui/mini-calendar` | Sidebar date picker |
| `@kibo-ui/gantt` | Project timeline |

### 4.2 Existing Shadcn Components (Already Installed)

- Dialog, Sheet, Popover
- Button, Input, Select, Checkbox
- Card, Badge, Avatar
- Calendar (date picker)
- Form components

---

## 5. Key Algorithms

### 5.1 Routine Instance Generation

```typescript
// Called when:
// 1. Routine template created/updated
// 2. User navigates to future date without instances
// 3. Daily cron job (optional)

async function generateRoutineInstances(
  templateId: string,
  fromDate: Date,
  toDate: Date // typically fromDate + 14 days
): Promise<RoutineInstance[]> {
  const template = await getRoutineTemplate(templateId);
  const existingInstances = await getInstancesInRange(templateId, fromDate, toDate);
  
  // Parse RRULE to get occurrence dates
  const rule = RRule.fromString(template.recurrence_rule);
  const occurrences = rule.between(fromDate, toDate, true);
  
  const newInstances: RoutineInstance[] = [];
  
  for (const date of occurrences) {
    // Skip if instance already exists
    if (existingInstances.some(i => isSameDay(i.scheduled_date, date))) {
      continue;
    }
    
    // Create instance with preferred time from constraints
    newInstances.push({
      template_id: templateId,
      user_id: template.user_id,
      scheduled_date: date,
      scheduled_start: template.constraints.preferred_start,
      scheduled_end: calculateEndTime(template.constraints),
      status: 'pending'
    });
  }
  
  return await batchInsertInstances(newInstances);
}
```

### 5.2 Calendar Data Aggregation

```typescript
// Fetch all items for a date range (for calendar display)

async function getCalendarEvents(
  userId: string,
  startDate: Date,
  endDate: Date,
  filters: CalendarFilters
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  
  // 1. Routine Instances
  if (filters.showRoutines) {
    const instances = await getRoutineInstancesInRange(userId, startDate, endDate);
    const filteredByDomain = filterByDomains(instances, filters.hiddenDomainIds);
    events.push(...mapToCalendarEvents(filteredByDomain, 'routine'));
  }
  
  // 2. Tasks with due date
  if (filters.showTasks) {
    const tasks = await getTasksInRange(userId, startDate, endDate);
    const filteredByDomain = filterByDomains(tasks, filters.hiddenDomainIds);
    events.push(...mapToCalendarEvents(filteredByDomain, 'task'));
  }
  
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}
```

### 5.3 Conflict Detection

```typescript
// Detect overlapping events

function detectConflicts(events: CalendarEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];
  
  // Sort by start time
  const sorted = events.sort((a, b) => a.start.getTime() - b.start.getTime());
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    // Check if they overlap
    if (current.end > next.start) {
      conflicts.push({
        event1: current,
        event2: next,
        overlapMinutes: (current.end.getTime() - next.start.getTime()) / 60000
      });
    }
  }
  
  return conflicts;
}
```

---

## 6. API Layer (Server Actions)

### 6.1 New Actions

```typescript
// Calendar
getCalendarEvents(startDate, endDate, filters): CalendarEvent[]
saveCalendarPreferences(preferences): void

// Timer
startTaskTimer(taskId): Task
pauseTaskTimer(taskId): Task
stopTaskTimer(taskId): Task

// Media
uploadTrackingMedia(entityType, entityId, file): Media
deleteTrackingMedia(mediaId): void
getMediaForEntity(entityType, entityId): Media[]

// Projects
getProjects(): Project[]
getProject(id): Project & { tasks: Task[], dependencies: Dependency[] }
createProject(input): Project
updateProject(input): Project
archiveProject(id): void

// Dependencies (Gantt)
createTaskDependency(predecessorId, successorId, type): Dependency
deleteTaskDependency(dependencyId): void

// Preferences
getUserPreferences(): UserPreferences
updateUserPreferences(input): UserPreferences
```

---

## 7. Storage Configuration

### 7.1 Supabase Storage Bucket

```sql
-- Create bucket for tracking media
INSERT INTO storage.buckets (id, name, public)
VALUES ('lifeos-media', 'lifeos-media', false);

-- RLS Policy
CREATE POLICY "Users can manage own media files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'lifeos-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 7.2 File Path Convention

```
lifeos-media/
└── {user_id}/
    ├── routine-instances/
    │   └── {instance_id}/
    │       ├── photo_1.jpg
    │       └── video_1.mp4
    └── tasks/
        └── {task_id}/
            └── document_1.pdf
```

---

## 8. Migration Strategy

### 8.1 Order of Operations

1. Create new migration file: `20251206000000_lifeos_planning_v2.sql`
2. Run migration: `supabase db push`
3. Regenerate types: `supabase gen types typescript --local > src/lib/supabase/database.types.ts`
4. Create storage bucket
5. Update schemas and services
6. Implement new components

### 8.2 Backward Compatibility

- Existing data preserved
- AI planning tables kept (suspended, not deleted)
- Old timeline view becomes "Day View"
- Existing tracking still works

---

## 9. Dependencies to Add

```json
{
  "dependencies": {
    "rrule": "^2.8.1",
    "date-fns": "^3.6.0"
  }
}
```

Note: `date-fns` and `jotai` will be added by Kibo-UI calendar installation.

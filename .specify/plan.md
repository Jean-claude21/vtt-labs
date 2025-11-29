# Intelligent Personal Planning Engine: Technical Plan

This document translates the functional requirements from `spec.md` into a technical blueprint, adhering to the principles defined in `constitution.md`.

---

## 1. Architecture Overview

The application will follow a modern web architecture based on the project constitution.

-   **Frontend Framework**: [Next.js 15](https://nextjs.org/) (App Router) will be used for both server-rendered and client-side components.
-   **UI Library**: [Shadcn UI](https://ui.shadcn.com/) will provide the base components, customized to match the specified Linear-like design system.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) will be used for all styling, in conjunction with Shadcn UI.
-   **Backend Logic**: All client-server communication will be handled exclusively through [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations).
-   **Database**: [Supabase Postgres](https://supabase.com/database) will serve as the primary database.
-   **Data Access Layer**: All database mutations will be performed via [Supabase RPC (Remote Procedure Calls)](https://supabase.com/docs/guides/database/functions), and complex queries will use Supabase Views for efficiency, as mandated by the constitution.

---

## 2. Database Schema (Supabase)

The following tables will be created in the `public` schema within Supabase.

### Table: `domains`
Stores the user-defined "Domains of Life."

| Column      | Type        | Constraints                               |
| :---------- | :---------- | :---------------------------------------- |
| `id`        | `uuid`      | **Primary Key**, default `gen_random_uuid()` |
| `user_id`   | `uuid`      | **Foreign Key** -> `auth.users(id)`       |
| `name`      | `text`      | `NOT NULL`                                |
| `color`     | `text`      | `NOT NULL` (e.g., hex color code)         |
| `created_at`| `timestamptz` | `NOT NULL`, default `now()`               |

### Table: `routines`
Stores user-defined recurring activities.

| Column                | Type        | Constraints                               |
| :-------------------- | :---------- | :---------------------------------------- |
| `id`                  | `uuid`      | **Primary Key**, default `gen_random_uuid()` |
| `user_id`             | `uuid`      | **Foreign Key** -> `auth.users(id)`       |
| `domain_id`           | `uuid`      | **Foreign Key** -> `public.domains(id)`   |
| `title`               | `text`      | `NOT NULL`                                |
| `duration_minutes`    | `integer`   | `NOT NULL`                                |
| `frequency`           | `text`      | `NOT NULL` (e.g., 'daily', 'weekly')      |
| `preferred_time_slot` | `text`      | `NOT NULL` (e.g., 'morning', 'evening')   |
| `created_at`          | `timestamptz` | `NOT NULL`, default `now()`               |

### Table: `tasks`
Stores user-defined one-off tasks.

| Column          | Type        | Constraints                               |
| :-------------- | :---------- | :---------------------------------------- |
| `id`            | `uuid`      | **Primary Key**, default `gen_random_uuid()` |
| `user_id`       | `uuid`      | **Foreign Key** -> `auth.users(id)`       |
| `domain_id`     | `uuid`      | **Foreign Key** -> `public.domains(id)`   |
| `title`         | `text`      | `NOT NULL`                                |
| `duration_minutes` | `integer`   | `NOT NULL`                                |
| `deadline`      | `timestamptz` | `NULLABLE`                                |
| `is_completed`  | `boolean`   | `NOT NULL`, default `false`               |
| `created_at`    | `timestamptz` | `NOT NULL`, default `now()`               |

### Table: `schedule`
Stores the generated schedule, containing events, routines, and tasks.

| Column              | Type        | Constraints                               |
| :------------------ | :---------- | :---------------------------------------- |
| `id`                | `uuid`      | **Primary Key**, default `gen_random_uuid()` |
| `user_id`           | `uuid`      | **Foreign Key** -> `auth.users(id)`       |
| `item_id`           | `uuid`      | `NULLABLE` (FK to `tasks` or `routines`)  |
| `item_type`         | `text`      | `NOT NULL` (e.g., 'task', 'routine', 'external') |
| `title`             | `text`      | `NOT NULL` (Denormalized for performance) |
| `start_time`        | `timestamptz` | `NOT NULL`                                |
| `end_time`          | `timestamptz` | `NOT NULL`                                |
| `execution_status`  | `text`      | `NOT NULL`, default `'pending'`           |
| `actual_start_time` | `timestamptz` | `NULLABLE`                                |
| `actual_end_time`   | `timestamptz` | `NULLABLE`                                |

---

## 3. API Layer (Supabase RPC)

The following RPC functions will be created to handle all data mutations, as required by the constitution.

-   `create_domain(name text, color text)`
-   `update_domain(p_id uuid, p_name text, p_color text)`
-   `delete_domain(p_id uuid)`
-   `create_routine(domain_id uuid, title text, ...)`
-   `update_routine(p_id uuid, ...)`
-   `delete_routine(p_id uuid)`
-   `create_task(domain_id uuid, title text, ...)`
-   `update_task(p_id uuid, ...)`
-   `delete_task(p_id uuid)`
-   `update_schedule_item_status(p_id uuid, p_status text, p_actual_start timestamptz, p_actual_end timestamptz)`
-   `generate_schedule(p_from_date date, p_to_date date)`: The core RPC that orchestrates the schedule generation logic.

---

## 4. File Structure & Component Breakdown

The project will use the feature-based directory structure defined in `constitution.md`.

```
src/
├── app/
│   ├── dashboard/page.tsx       # Main view for the generated schedule
│   ├── settings/page.tsx        # Page for managing domains, routines, etc.
│   └── statistics/page.tsx      # Page for displaying user statistics
├── features/
│   ├── domains/
│   │   ├── components/          # DomainList, DomainForm
│   │   ├── actions/domainActions.ts # Server Actions for domains
│   │   └── schema/domainSchema.ts   # Zod schemas for validation
│   ├── routines/
│   │   ├── ...
│   ├── tasks/
│   │   ├── ...
│   ├── calendar-sync/
│   │   ├── components/          # GoogleCalendarConnectButton
│   │   ├── actions/calendarActions.ts # Handle OAuth flow
│   │   └── services/googleCalendar.ts # Google Calendar API client
│   ├── schedule-generator/
│   │   ├── components/          # GenerateScheduleButton, ScheduleView
│   │   └── actions/scheduleActions.ts
│   ├── execution-tracker/
│   │   ├── components/          # ScheduleItem with status controls
│   │   └── actions/trackerActions.ts
│   └── statistics/
│       ├── components/          # TimeDistributionChart, CompletionRateChart
│       └── services/statistics.ts   # Fetches data from Supabase views
├── components/
│   └── ui/                      # Shared Shadcn UI components
└── lib/
    ├── supabase/                # Supabase client configuration
    └── utils.ts                 # Shared utility functions
```

---

## 5. Dependencies

-   `next`: Core framework
-   `react`, `react-dom`: UI library
-   `@supabase/ssr`, `@supabase/supabase-js`: Supabase integration
-   `shadcn-ui`, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`, `tailwindcss-animate`: UI and styling
-   `zod`: Schema validation
-   `recharts`: For data visualization on the statistics page
-   `@next/third-parties`: For Google Calendar integration

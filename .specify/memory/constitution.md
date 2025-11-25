<!--
SYNC IMPACT REPORT
Version: 1.0.0 -> 1.0.0 (Maintenance)
Modified Principles:
- None
Added Sections:
- None
Templates requiring updates:
- None
Follow-up TODOs:
- ✅ Refactor existing codebase to match `features/` directory structure defined in Principle II.
-->
# vtt-labs Constitution

## Core Principles

### I. Core Stack
Framework: Next.js 15 (App Router).
Server Logic: Server Actions exclusively. API Routes are forbidden.
Database: Supabase Postgres with RLS (Row-Level Security) disabled.
Data Access: Primarily via Supabase RPC for mutations and Views for complex queries.
UI Library: Shadcn UI.
Styling: TailwindCSS.
Tooling: Speckit for orchestration, MCP shadcn for component generation.

### II. Code Architecture (Feature-Based)
The codebase is organized into isolated modules within the `features/` directory.
Each feature directory MUST contain:
- `components/`: Feature-specific React components.
- `actions/`: Server Actions related to the feature.
- `schema/`: Zod schemas for validation.
- `services/`: Core business logic.

The `app/` directory is strictly for routing, layouts, and page entry points. It MUST NOT contain business logic.
Database definitions (Tables, RPCs, Views) exist only within Supabase migrations, not in the application codebase.

### III. UI & UX Principles
b. Linear-like Design System: All UI MUST strictly follow a Linear-inspired design system: high density, minimalist layout, Zinc/New York palette, Inter font, reduced border-radius, and compact components. Shadcn UI is the base library, but all customizations must preserve this style. Shared, global components reside in `components/ui/`.
- Loading: Use Skeleton components from Shadcn UI.
- Empty: Display a clear, user-friendly message with a call-to-action.
- Error: Display a simple error message with a retry mechanism.

### IV. Server-Side Logic
a. Server Actions: Are the single entry point for all client-server communication. They validate inputs using a Zod schema, call a service, and return a result. They MUST NOT contain direct business logic.
b. Services: Contain the core business logic. They are pure, testable modules with no Next.js or UI dependencies. They call Supabase RPCs to interact with the database.

### V. Performance
a. Backend: Prefer single, powerful RPCs over multiple simple queries to reduce database round-trips.
b. Frontend:
- All images MUST use the Next.js `<Image>` component for optimization.
- All web fonts MUST be loaded via `next/font`.
- Prioritize Server Components; use Client Components (`"use client"`) only when interactivity is essential.

### VI. Error Handling & User Feedback
a. API Response: All Server Actions MUST return a standardized `{ data, error }` object.
b. User Notifications: Feedback to the user (success or failure) MUST be displayed using a non-blocking Toast component. `alert()` is forbidden.

### VIII. Design System Compliance
All contributors MUST ensure every new UI or refactor matches the Linear-like design system described above. Any deviation requires explicit justification and review.

### VII. Code Quality & Consistency
a. Reusability: Duplicated code is not acceptable and must be refactored into a shared utility, hook, or component.
b. Formatting: The project MUST be configured with ESLint and Prettier to enforce a single, consistent code style.

## Governance

This constitution supersedes all other practices. Any deviation requires a formal amendment.
Amendments are to be dated and justified at the end of this document.

**Version**: 1.1.0 | **Ratified**: 2025-11-25 | **Last Amended**: 2025-11-25

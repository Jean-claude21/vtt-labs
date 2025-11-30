# Implementation Plan: LifeOS Planning V1

**Branch**: `001-lifeos-planning` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-lifeos-planning/spec.md`

## Summary

**LifeOS Planning V1** est un système intelligent de génération automatique de plannings basés sur des routines et contraintes, avec tracking prévu vs réalisé.

**Approche technique** :
- 7 nouvelles tables PostgreSQL avec RLS (domains, routines, tasks, projects, plans, etc.)
- Module feature complet `src/features/lifeos/` avec sous-modules (domains, routines, tasks, projects, planning)
- Intégration OpenAI pour la génération de plannings avec raisonnements
- Timeline UI interactive avec Shadcn UI components
- Server Actions pour toutes les mutations

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js 15.x, React 19.x, Supabase, Shadcn UI, TailwindCSS 4.x, Zod 3.x, OpenAI API  
**Storage**: Supabase Postgres avec RLS  
**Testing**: Vitest (à configurer si non présent)  
**Target Platform**: Web (Desktop-first responsive)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Planning generation < 10s, UI interactions < 100ms, support 50+ routines/user  
**Constraints**: < 200ms p95 for CRUD operations, offline-capable V2 (hors scope V1)  
**Scale/Scope**: Multi-user, ~10 screens, ~7 tables, 1 AI integration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Core Stack Compliance

| Règle | Statut | Notes |
|-------|--------|-------|
| Next.js 15 App Router | ✅ PASS | Routing dans `src/app/app/lifeos/` |
| TypeScript Strict | ✅ PASS | Tous les types définis |
| Supabase Auth | ✅ PASS | Réutilise auth existant |
| Supabase Postgres + RLS | ✅ PASS | 7 nouvelles tables avec policies |
| Server Actions Only | ✅ PASS | Aucune API Route |
| Zod Validation | ✅ PASS | Schemas pour toutes les entités |
| Shadcn UI | ✅ PASS | Composants UI existants + nouveaux |
| pnpm | ✅ PASS | Package manager existant |

### ✅ Architecture Compliance

| Règle | Statut | Notes |
|-------|--------|-------|
| App Directory = Routing Only | ✅ PASS | Pages sans logique métier |
| Feature Module Structure | ✅ PASS | `features/lifeos/` avec components/actions/services/schema |
| Module Isolation | ✅ PASS | Imports via `features/shared/` uniquement |
| Tables Préfixées | ✅ PASS | `lifeos_domains`, `lifeos_routines`, etc. |
| user_id + RLS | ✅ PASS | Toutes les tables ont user_id + policies |

### ✅ UI/UX Compliance

| Règle | Statut | Notes |
|-------|--------|-------|
| Linear-Style Design | ✅ PASS | Haute densité, border-radius-md |
| États UI (Loading/Empty/Error) | ✅ PASS | Skeleton + Empty states + Toasts |
| Light Mode Default | ✅ PASS | Conforme au design system |
| Couleur Module | ✅ PASS | Utiliser `cyan-500` (Learning) ou nouvelle couleur |

### ⚠️ Items à Définir

| Item | Décision |
|------|----------|
| Couleur accent LifeOS | **`teal-500`** (#14B8A6) — Non utilisée actuellement |
| Slug module | **`lifeos`** |
| OpenAI Model | **`gpt-4o-mini`** pour génération planning (coût optimisé) |

## Project Structure

### Documentation (this feature)

```text
specs/001-lifeos-planning/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI/TypeScript types)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── app/
│       └── lifeos/                    # LifeOS module routing
│           ├── page.tsx               # Dashboard/Planning view
│           ├── layout.tsx             # Module layout
│           ├── domains/
│           │   └── page.tsx           # Domains management
│           ├── routines/
│           │   └── page.tsx           # Routines management
│           ├── tasks/
│           │   └── page.tsx           # Tasks management
│           ├── projects/
│           │   └── page.tsx           # Projects management
│           └── analytics/
│               └── page.tsx           # Stats & Streaks
│
├── features/
│   └── lifeos/                        # LifeOS feature module
│       ├── components/
│       │   ├── domains/               # Domain UI components
│       │   │   ├── domain-card.tsx
│       │   │   ├── domain-form.tsx
│       │   │   └── domains-list.tsx
│       │   ├── routines/              # Routine UI components
│       │   │   ├── routine-card.tsx
│       │   │   ├── routine-form.tsx
│       │   │   ├── routine-instance-tracker.tsx
│       │   │   └── routines-list.tsx
│       │   ├── tasks/                 # Task UI components
│       │   │   ├── task-card.tsx
│       │   │   ├── task-form.tsx
│       │   │   └── tasks-list.tsx
│       │   ├── projects/              # Project UI components
│       │   │   ├── project-card.tsx
│       │   │   └── projects-list.tsx
│       │   ├── planning/              # Planning/Timeline UI
│       │   │   ├── timeline-view.tsx
│       │   │   ├── plan-slot.tsx
│       │   │   ├── generate-plan-button.tsx
│       │   │   └── day-navigator.tsx
│       │   └── analytics/             # Analytics UI
│       │       ├── completion-chart.tsx
│       │       ├── streaks-list.tsx
│       │       └── domain-time-chart.tsx
│       │
│       ├── actions/
│       │   ├── domains.actions.ts
│       │   ├── routines.actions.ts
│       │   ├── tasks.actions.ts
│       │   ├── projects.actions.ts
│       │   ├── planning.actions.ts
│       │   └── analytics.actions.ts
│       │
│       ├── services/
│       │   ├── domains.service.ts
│       │   ├── routines.service.ts
│       │   ├── tasks.service.ts
│       │   ├── projects.service.ts
│       │   ├── planning.service.ts    # AI scheduling logic
│       │   ├── analytics.service.ts
│       │   └── ai/
│       │       └── scheduler.ai.ts    # OpenAI integration
│       │
│       └── schema/
│           ├── domains.schema.ts
│           ├── routines.schema.ts
│           ├── tasks.schema.ts
│           ├── projects.schema.ts
│           └── planning.schema.ts
│
└── lib/
    └── supabase/
        └── database.types.ts          # Updated with lifeos tables

supabase/
└── migrations/
    └── 20251130_lifeos_planning.sql   # All LifeOS tables + RLS
```

**Structure Decision**: Web application suivant la constitution VTT Labs. Le module LifeOS suit le pattern `features/[module]/` avec sous-organisation par entité métier (domains, routines, tasks, projects, planning, analytics).

## Complexity Tracking

> Aucune violation de la constitution détectée. Pas de justification nécessaire.

| Aspect | Évaluation |
|--------|------------|
| Tables (9) | Conforme — Préfixées `lifeos_`, RLS activé |
| OpenAI Integration | Conforme — Service isolé dans `services/ai/` |
| Module Structure | Conforme — Pattern standard `features/` |

---

## Constitution Check — Post-Design Validation

*Re-evaluated after Phase 1 design completion.*

### ✅ Data Model Compliance

| Règle | Statut | Notes |
|-------|--------|-------|
| Tables préfixées `[module]_` | ✅ PASS | Toutes préfixées `lifeos_` |
| `user_id` sur toutes les tables | ✅ PASS | Présent + FK profiles(id) |
| RLS Pattern Standard | ✅ PASS | 4 policies par table (SELECT/INSERT/UPDATE/DELETE) |
| Indexes appropriés | ✅ PASS | Définis pour les colonnes WHERE/ORDER BY |
| Contraintes CHECK | ✅ PASS | Enums validés, scores 0-100, etc. |

### ✅ Service Layer Compliance

| Règle | Statut | Notes |
|-------|--------|-------|
| Services sans dépendances Next.js | ✅ PASS | Pure functions, testables |
| Actions → Services → Supabase | ✅ PASS | Architecture conforme |
| Validation Zod en premier | ✅ PASS | Pattern ActionResult |
| Retour `{ data, error }` | ✅ PASS | Standardisé |

### ✅ UI Compliance

| Règle | Statut | Notes |
|-------|--------|-------|
| Server Components First | ✅ PASS | Prévu dans les pages |
| Loading/Empty/Error states | ✅ PASS | Prévu pour chaque liste |
| Toasts pour feedback | ✅ PASS | Sonner existant |
| Shadcn components | ✅ PASS | Réutilisation + nouveaux |

### ✅ Final Gate Status

| Gate | Status |
|------|--------|
| Pre-Research (Phase 0) | ✅ PASSED |
| Post-Design (Phase 1) | ✅ PASSED |

**Conclusion**: Le design est conforme à la constitution VTT Labs v2.2.1. Aucune violation détectée. Prêt pour Phase 2 (tasks generation).

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Plan | `specs/001-lifeos-planning/plan.md` | ✅ Complete |
| Research | `specs/001-lifeos-planning/research.md` | ✅ Complete |
| Data Model | `specs/001-lifeos-planning/data-model.md` | ✅ Complete |
| Contracts (Types) | `specs/001-lifeos-planning/contracts/types.ts` | ✅ Complete |
| Contracts (Actions) | `specs/001-lifeos-planning/contracts/actions.ts` | ✅ Complete |
| Quickstart | `specs/001-lifeos-planning/quickstart.md` | ✅ Complete |
| Agent Context | `.github/agents/copilot-instructions.md` | ✅ Updated |


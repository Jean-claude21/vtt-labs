# Data Model: LifeOS Planning V1

**Feature**: 001-lifeos-planning  
**Date**: 2025-11-30  
**Status**: Complete

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              LIFEOS DATA MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────┐         ┌──────────────────────┐                             │
│  │  lifeos_domains  │         │   lifeos_projects    │                             │
│  ├──────────────────┤         ├──────────────────────┤                             │
│  │ id (PK)          │◄───┬────│ domain_id (FK)       │                             │
│  │ user_id (FK)     │    │    │ id (PK)              │                             │
│  │ name             │    │    │ user_id (FK)         │                             │
│  │ icon             │    │    │ name                 │                             │
│  │ color            │    │    │ description          │                             │
│  │ vision           │    │    │ status               │                             │
│  │ daily_target_min │    │    │ start_date           │                             │
│  │ weekly_target_min│    │    │ target_date          │                             │
│  │ sort_order       │    │    │ created_at           │                             │
│  │ is_default       │    │    │ updated_at           │                             │
│  │ created_at       │    │    └──────────┬───────────┘                             │
│  │ updated_at       │    │               │                                         │
│  └──────────────────┘    │               │                                         │
│           │              │               │                                         │
│           │              │               ▼                                         │
│           │              │    ┌──────────────────────┐                             │
│           │              │    │    lifeos_tasks      │                             │
│           │              │    ├──────────────────────┤                             │
│           │              ├────│ domain_id (FK)       │                             │
│           │              │    │ project_id (FK)      │────────────────┘            │
│           │              │    │ id (PK)              │                             │
│           │              │    │ user_id (FK)         │                             │
│           │              │    │ title                │                             │
│           │              │    │ description          │                             │
│           │              │    │ status               │                             │
│           │              │    │ priority             │                             │
│           │              │    │ estimated_minutes    │                             │
│           │              │    │ actual_minutes       │                             │
│           │              │    │ due_date             │                             │
│           │              │    │ due_time             │                             │
│           │              │    │ is_deadline_strict   │                             │
│           │              │    │ parent_task_id (FK)  │───┐ (self-reference)        │
│           │              │    │ created_at           │◄──┘                         │
│           │              │    │ updated_at           │                             │
│           │              │    └──────────────────────┘                             │
│           │              │                                                         │
│           ▼              │                                                         │
│  ┌──────────────────────────┐                                                      │
│  │ lifeos_routine_templates │                                                      │
│  ├──────────────────────────┤                                                      │
│  │ id (PK)                  │                                                      │
│  │ user_id (FK)             │                                                      │
│  │ domain_id (FK)       ────┼────────────────────────────────────────────────┐     │
│  │ name                     │                                                │     │
│  │ description              │                                                │     │
│  │ category_moment          │   (enum: morning/noon/afternoon/evening/night) │     │
│  │ category_type            │   (enum: professional/personal/spiritual/...)  │     │
│  │ constraints (JSONB)      │                                                │     │
│  │ recurrence_rule          │   (RRULE string)                               │     │
│  │ recurrence_config (JSONB)│                                                │     │
│  │ priority                 │                                                │     │
│  │ is_flexible              │                                                │     │
│  │ is_active                │                                                │     │
│  │ created_at               │                                                │     │
│  │ updated_at               │                                                │     │
│  └────────────┬─────────────┘                                                │     │
│               │                                                              │     │
│               │                                                              │     │
│               ▼                                                              │     │
│  ┌──────────────────────────┐        ┌─────────────────────────────┐         │     │
│  │ lifeos_routine_instances │        │ lifeos_routine_instance_tasks│        │     │
│  ├──────────────────────────┤        ├─────────────────────────────┤         │     │
│  │ id (PK)                  │◄───────│ routine_instance_id (FK)    │         │     │
│  │ template_id (FK)     ────┼──┐     │ task_id (FK)            ────┼─────────┼───► │
│  │ user_id (FK)             │  │     │ id (PK)                     │         │     │
│  │ scheduled_date           │  │     │ time_spent_minutes          │         │     │
│  │ scheduled_start          │  │     │ notes                       │         │     │
│  │ scheduled_end            │  │     │ created_at                  │         │     │
│  │ actual_start             │  │     └─────────────────────────────┘         │     │
│  │ actual_end               │  │                                             │     │
│  │ actual_value             │  │                                             │     │
│  │ status                   │  │   (enum: pending/completed/partial/skipped) │     │
│  │ skip_reason              │  │                                             │     │
│  │ completion_score         │  │                                             │     │
│  │ mood_before              │  │                                             │     │
│  │ mood_after               │  │                                             │     │
│  │ energy_level             │  │                                             │     │
│  │ notes                    │  │                                             │     │
│  │ created_at               │  │                                             │     │
│  │ updated_at               │  │                                             │     │
│  └──────────────────────────┘  │                                             │     │
│               │                │                                             │     │
│               │                │                                             │     │
│               │                │     ┌─────────────────────┐                 │     │
│               │                │     │   lifeos_streaks    │                 │     │
│               │                │     ├─────────────────────┤                 │     │
│               │                └────►│ routine_template_id │                 │     │
│               │                      │ id (PK)             │                 │     │
│               │                      │ user_id (FK)        │                 │     │
│               │                      │ current_streak      │                 │     │
│               │                      │ longest_streak      │                 │     │
│               │                      │ last_completed_date │                 │     │
│               │                      │ updated_at          │                 │     │
│               │                      └─────────────────────┘                 │     │
│               │                                                              │     │
│               ▼                                                              │     │
│  ┌──────────────────────────┐                                                │     │
│  │  lifeos_generated_plans  │                                                │     │
│  ├──────────────────────────┤                                                │     │
│  │ id (PK)                  │                                                │     │
│  │ user_id (FK)             │                                                │     │
│  │ date (UNIQUE per user)   │                                                │     │
│  │ status                   │   (enum: draft/active/completed)               │     │
│  │ generation_params (JSONB)│                                                │     │
│  │ ai_model                 │                                                │     │
│  │ optimization_score       │                                                │     │
│  │ created_at               │                                                │     │
│  │ updated_at               │                                                │     │
│  └────────────┬─────────────┘                                                │     │
│               │                                                              │     │
│               ▼                                                              │     │
│  ┌──────────────────────────┐                                                │     │
│  │   lifeos_plan_slots      │                                                │     │
│  ├──────────────────────────┤                                                │     │
│  │ id (PK)                  │                                                │     │
│  │ plan_id (FK)         ────┼──────────────────────────────────────────┐     │     │
│  │ user_id (FK)             │                                          │     │     │
│  │ start_time               │                                          │     │     │
│  │ end_time                 │                                          │     │     │
│  │ slot_type                │   (enum: routine/task/break/buffer/event)│     │     │
│  │ entity_type              │   (enum: routine_instance/task/null)     │     │     │
│  │ entity_id                │   (UUID → routine_instance or task)      │     │     │
│  │ ai_reasoning             │                                          │     │     │
│  │ sort_order               │                                          │     │     │
│  │ is_locked                │   (non-déplaçable)                       │     │     │
│  │ was_executed             │                                          │     │     │
│  │ created_at               │                                          │     │     │
│  └──────────────────────────┘                                          │     │     │
│                                                                        │     │     │
└────────────────────────────────────────────────────────────────────────┴─────┴─────┘
```

---

## Table Definitions

### 1. lifeos_domains

Catégories de vie de l'utilisateur.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| user_id | UUID | NOT NULL, FK profiles(id) ON DELETE CASCADE | Propriétaire |
| name | TEXT | NOT NULL | Nom du domaine |
| icon | TEXT | NOT NULL DEFAULT '📌' | Emoji ou icône |
| color | TEXT | NOT NULL DEFAULT '#6B7280' | Hex color code |
| vision | TEXT | | Vision/objectif long terme |
| daily_target_minutes | INTEGER | | Budget temps journalier |
| weekly_target_minutes | INTEGER | | Budget temps hebdomadaire |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | Ordre d'affichage |
| is_default | BOOLEAN | NOT NULL DEFAULT false | Domaine pré-créé |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(user_id)`, `(user_id, sort_order)`

---

### 2. lifeos_projects

Conteneurs de tâches avec objectif commun.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| user_id | UUID | NOT NULL, FK profiles(id) ON DELETE CASCADE | Propriétaire |
| domain_id | UUID | FK lifeos_domains(id) ON DELETE SET NULL | Domaine associé |
| name | TEXT | NOT NULL | Nom du projet |
| description | TEXT | | Description détaillée |
| status | TEXT | NOT NULL DEFAULT 'active', CHECK (status IN ('active', 'paused', 'completed', 'archived')) | Statut |
| start_date | DATE | | Date de début |
| target_date | DATE | | Date cible de fin |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(user_id)`, `(user_id, status)`, `(domain_id)`

---

### 3. lifeos_tasks

Actions ponctuelles à réaliser.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| user_id | UUID | NOT NULL, FK profiles(id) ON DELETE CASCADE | Propriétaire |
| domain_id | UUID | FK lifeos_domains(id) ON DELETE SET NULL | Domaine associé |
| project_id | UUID | FK lifeos_projects(id) ON DELETE SET NULL | Projet parent |
| parent_task_id | UUID | FK lifeos_tasks(id) ON DELETE CASCADE | Tâche parente (sous-tâches) |
| title | TEXT | NOT NULL | Titre |
| description | TEXT | | Description |
| status | TEXT | NOT NULL DEFAULT 'todo', CHECK (status IN ('backlog', 'todo', 'in_progress', 'blocked', 'done', 'cancelled', 'archived')) | Statut |
| priority | TEXT | NOT NULL DEFAULT 'medium', CHECK (priority IN ('high', 'medium', 'low')) | Priorité |
| estimated_minutes | INTEGER | | Durée estimée |
| actual_minutes | INTEGER | DEFAULT 0 | Temps réel passé |
| due_date | DATE | | Date d'échéance |
| due_time | TIME | | Heure d'échéance (optionnel) |
| is_deadline_strict | BOOLEAN | NOT NULL DEFAULT false | Deadline non-négociable |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(user_id)`, `(user_id, status)`, `(user_id, priority)`, `(domain_id)`, `(project_id)`, `(due_date)`

---

### 4. lifeos_routine_templates

Définitions d'habitudes récurrentes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| user_id | UUID | NOT NULL, FK profiles(id) ON DELETE CASCADE | Propriétaire |
| domain_id | UUID | FK lifeos_domains(id) ON DELETE SET NULL | Domaine associé |
| name | TEXT | NOT NULL | Nom de la routine |
| description | TEXT | | Description |
| category_moment | TEXT | CHECK (category_moment IN ('morning', 'noon', 'afternoon', 'evening', 'night')) | Catégorie moment |
| category_type | TEXT | CHECK (category_type IN ('professional', 'personal', 'spiritual', 'health', 'learning', 'leisure', 'energy')) | Catégorie type |
| constraints | JSONB | NOT NULL DEFAULT '{}' | Contraintes flexibles |
| recurrence_rule | TEXT | NOT NULL | RRULE iCalendar |
| recurrence_config | JSONB | NOT NULL DEFAULT '{}' | Config UI-friendly |
| priority | TEXT | NOT NULL DEFAULT 'medium', CHECK (priority IN ('high', 'medium', 'low')) | Priorité |
| is_flexible | BOOLEAN | NOT NULL DEFAULT true | Créneau ajustable |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Routine active |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(user_id)`, `(user_id, is_active)`, `(domain_id)`

**Constraints JSONB Schema**:
```typescript
{
  duration?: {
    required: boolean;
    minutes: number;
  };
  timeSlot?: {
    required: boolean;
    startTime: string; // "HH:mm"
    endTime: string;
  };
  targetValue?: {
    required: boolean;
    value: number;
    unit: string;
  };
}
```

---

### 5. lifeos_routine_instances

Occurrences spécifiques d'une routine.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| template_id | UUID | NOT NULL, FK lifeos_routine_templates(id) ON DELETE CASCADE | Routine parente |
| user_id | UUID | NOT NULL, FK profiles(id) ON DELETE CASCADE | Propriétaire |
| scheduled_date | DATE | NOT NULL | Date planifiée |
| scheduled_start | TIME | | Heure début planifiée |
| scheduled_end | TIME | | Heure fin planifiée |
| actual_start | TIMESTAMPTZ | | Heure début réelle |
| actual_end | TIMESTAMPTZ | | Heure fin réelle |
| actual_value | NUMERIC | | Valeur atteinte (si target) |
| status | TEXT | NOT NULL DEFAULT 'pending', CHECK (status IN ('pending', 'completed', 'partial', 'skipped')) | Statut |
| skip_reason | TEXT | | Raison du skip |
| completion_score | INTEGER | CHECK (completion_score >= 0 AND completion_score <= 100) | Score 0-100 |
| mood_before | INTEGER | CHECK (mood_before >= 1 AND mood_before <= 5) | Humeur avant (1-5) |
| mood_after | INTEGER | CHECK (mood_after >= 1 AND mood_after <= 5) | Humeur après (1-5) |
| energy_level | INTEGER | CHECK (energy_level >= 1 AND energy_level <= 10) | Énergie (1-10) |
| notes | TEXT | | Notes utilisateur |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(user_id)`, `(template_id)`, `(user_id, scheduled_date)`, `(scheduled_date, status)`
**Unique**: `(template_id, scheduled_date)` — Une seule instance par routine par jour

---

### 6. lifeos_routine_instance_tasks

Tâches travaillées pendant une routine.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| routine_instance_id | UUID | NOT NULL, FK lifeos_routine_instances(id) ON DELETE CASCADE | Instance routine |
| task_id | UUID | NOT NULL, FK lifeos_tasks(id) ON DELETE CASCADE | Tâche |
| time_spent_minutes | INTEGER | NOT NULL DEFAULT 0 | Temps passé |
| notes | TEXT | | Notes |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Unique**: `(routine_instance_id, task_id)`

---

### 7. lifeos_streaks

Compteurs de séries pour les routines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| routine_template_id | UUID | NOT NULL UNIQUE, FK lifeos_routine_templates(id) ON DELETE CASCADE | Routine |
| user_id | UUID | NOT NULL, FK profiles(id) ON DELETE CASCADE | Propriétaire |
| current_streak | INTEGER | NOT NULL DEFAULT 0 | Série actuelle |
| longest_streak | INTEGER | NOT NULL DEFAULT 0 | Record |
| last_completed_date | DATE | | Dernière complétion |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

---

### 8. lifeos_generated_plans

Plannings générés par l'IA.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| user_id | UUID | NOT NULL, FK profiles(id) ON DELETE CASCADE | Propriétaire |
| date | DATE | NOT NULL | Date du planning |
| status | TEXT | NOT NULL DEFAULT 'draft', CHECK (status IN ('draft', 'active', 'completed')) | Statut |
| generation_params | JSONB | | Paramètres utilisés |
| ai_model | TEXT | | Modèle IA utilisé |
| optimization_score | INTEGER | CHECK (optimization_score >= 0 AND optimization_score <= 100) | Score optimisation |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Unique**: `(user_id, date)` — Un seul planning par jour par utilisateur

---

### 9. lifeos_plan_slots

Créneaux du planning.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identifiant unique |
| plan_id | UUID | NOT NULL, FK lifeos_generated_plans(id) ON DELETE CASCADE | Planning parent |
| user_id | UUID | NOT NULL, FK profiles(id) ON DELETE CASCADE | Propriétaire |
| start_time | TIME | NOT NULL | Heure début |
| end_time | TIME | NOT NULL | Heure fin |
| slot_type | TEXT | NOT NULL, CHECK (slot_type IN ('routine', 'task', 'break', 'buffer', 'event')) | Type de slot |
| entity_type | TEXT | CHECK (entity_type IN ('routine_instance', 'task')) | Type d'entité liée |
| entity_id | UUID | | ID routine_instance ou task |
| ai_reasoning | TEXT | | Explication IA |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | Ordre dans le plan |
| is_locked | BOOLEAN | NOT NULL DEFAULT false | Non déplaçable |
| was_executed | BOOLEAN | NOT NULL DEFAULT false | Exécuté ou non |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(plan_id)`, `(user_id)`, `(plan_id, sort_order)`

---

## Row Level Security Policies

Toutes les tables LifeOS utilisent le pattern RLS standard :

```sql
-- Pattern pour chaque table lifeos_*
ALTER TABLE lifeos_[table] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON lifeos_[table]
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own data" ON lifeos_[table]
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own data" ON lifeos_[table]
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own data" ON lifeos_[table]
  FOR DELETE USING (user_id = auth.uid());
```

---

## Database Functions (RPCs)

### lifeos_update_streak

Met à jour le streak d'une routine après complétion.

```sql
CREATE OR REPLACE FUNCTION lifeos_update_streak(
  p_routine_template_id UUID,
  p_completed_date DATE
) RETURNS lifeos_streaks
LANGUAGE plpgsql SECURITY DEFINER
AS $$...$$;
```

### lifeos_seed_default_domains

Crée les domaines par défaut pour un nouvel utilisateur.

```sql
CREATE OR REPLACE FUNCTION lifeos_seed_default_domains(p_user_id UUID)
RETURNS SETOF lifeos_domains
LANGUAGE plpgsql SECURITY DEFINER
AS $$...$$;
```

### lifeos_get_daily_analytics

Retourne les analytics agrégées pour une date.

```sql
CREATE OR REPLACE FUNCTION lifeos_get_daily_analytics(
  p_user_id UUID,
  p_date DATE
) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$...$$;
```

---

## Validation Rules Summary

| Entity | Rule | Enforcement |
|--------|------|-------------|
| Domain | Name unique per user | Application + UNIQUE constraint |
| Domain | Cannot delete if has linked items | Application check |
| Routine | Recurrence rule valid RRULE | Application (rrule library) |
| Routine | Constraints JSONB schema valid | Zod schema |
| Task | Status transitions valid | Application state machine |
| Task | actual_minutes >= 0 | CHECK constraint |
| Instance | One per template per day | UNIQUE constraint |
| Instance | completion_score 0-100 | CHECK constraint |
| Plan | One per user per day | UNIQUE constraint |
| Slot | end_time > start_time | Application validation |

# Quickstart: LifeOS Planning V1

**Feature**: 001-lifeos-planning  
**Date**: 2025-11-30

Ce guide permet à un développeur de démarrer rapidement l'implémentation de LifeOS Planning V1.

---

## Prérequis

- ✅ VTT Labs cloné et configuré
- ✅ Supabase local ou distant actif
- ✅ Variables d'environnement configurées (SUPABASE_URL, SUPABASE_ANON_KEY)
- ✅ OpenAI API Key configurée (`OPENAI_API_KEY`)
- ✅ pnpm installé

## 1. Migration Database

Créer et appliquer la migration :

```bash
# Créer le fichier de migration
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_lifeos_planning.sql
```

Contenu de la migration : voir `data-model.md` pour le schéma complet.

```bash
# Appliquer la migration
npx supabase db push

# Régénérer les types TypeScript
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

## 2. Structure des Fichiers

```bash
# Créer la structure du module
mkdir -p src/features/lifeos/{components,actions,services,schema}
mkdir -p src/features/lifeos/components/{domains,routines,tasks,projects,planning,analytics}
mkdir -p src/features/lifeos/services/ai
mkdir -p src/app/app/lifeos/{domains,routines,tasks,projects,analytics}
```

## 3. Ordre d'Implémentation Recommandé

### Phase A: Foundations (sans IA)

1. **Domains** — Base de tout
   - `schema/domains.schema.ts` — Zod schemas
   - `services/domains.service.ts` — CRUD logic
   - `actions/domains.actions.ts` — Server Actions
   - `components/domains/` — UI components
   - `app/app/lifeos/domains/page.tsx` — Route

2. **Routines** — Templates (sans instances)
   - `schema/routines.schema.ts`
   - `services/routines.service.ts`
   - `actions/routines.actions.ts`
   - `components/routines/`
   - `app/app/lifeos/routines/page.tsx`

3. **Tasks** — Gestion des tâches
   - `schema/tasks.schema.ts`
   - `services/tasks.service.ts`
   - `actions/tasks.actions.ts`
   - `components/tasks/`
   - `app/app/lifeos/tasks/page.tsx`

4. **Projects** — Conteneurs de tâches
   - `schema/projects.schema.ts`
   - `services/projects.service.ts`
   - `actions/projects.actions.ts`
   - `components/projects/`
   - `app/app/lifeos/projects/page.tsx`

### Phase B: Planning & Tracking

5. **Routine Instances** — Occurrences
   - `services/routine-instances.service.ts`
   - `actions/routine-instances.actions.ts`
   - Instance generation logic

6. **Planning AI** — Génération
   - `services/ai/scheduler.ai.ts` — OpenAI integration
   - `services/planning.service.ts`
   - `actions/planning.actions.ts`
   - `components/planning/timeline-view.tsx`
   - `app/app/lifeos/page.tsx` — Main planning view

7. **Tracking** — Complétion des routines
   - `components/routines/routine-instance-tracker.tsx`
   - Streak updates

### Phase C: Analytics

8. **Analytics** — Dashboard
   - `services/analytics.service.ts`
   - `actions/analytics.actions.ts`
   - `components/analytics/`
   - `app/app/lifeos/analytics/page.tsx`

## 4. Exemple: Premier Server Action

```typescript
// src/features/lifeos/actions/domains.actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { createDomainSchema } from '../schema/domains.schema';
import { domainService } from '../services/domains.service';
import type { ActionResult, Domain, CreateDomainInput } from '@/specs/001-lifeos-planning/contracts/types';

export async function createDomain(input: CreateDomainInput): Promise<ActionResult<Domain>> {
  // 1. Validation Zod
  const validated = createDomainSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.message };
  }

  // 2. Get user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // 3. Call service
  return domainService.create(user.id, validated.data);
}
```

## 5. Exemple: Premier Service

```typescript
// src/features/lifeos/services/domains.service.ts
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, Domain, CreateDomainInput } from '@/specs/001-lifeos-planning/contracts/types';

export const domainService = {
  async create(userId: string, input: CreateDomainInput): Promise<ActionResult<Domain>> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('lifeos_domains')
      .insert({
        user_id: userId,
        name: input.name,
        icon: input.icon ?? '📌',
        color: input.color ?? '#6B7280',
        vision: input.vision ?? null,
        daily_target_minutes: input.daily_target_minutes ?? null,
        weekly_target_minutes: input.weekly_target_minutes ?? null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  async getAll(userId: string): Promise<ActionResult<Domain[]>> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('lifeos_domains')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },
};
```

## 6. Exemple: Schema Zod

```typescript
// src/features/lifeos/schema/domains.schema.ts
import { z } from 'zod';

export const createDomainSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  vision: z.string().max(500).nullable().optional(),
  daily_target_minutes: z.number().int().positive().nullable().optional(),
  weekly_target_minutes: z.number().int().positive().nullable().optional(),
});

export const updateDomainSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  vision: z.string().max(500).nullable().optional(),
  daily_target_minutes: z.number().int().positive().nullable().optional(),
  weekly_target_minutes: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});
```

## 7. Ajouter au Module Access

```typescript
// src/lib/constants.ts (ou équivalent)
export const MODULE_SLUGS = [
  // ... existing modules
  'lifeos',
] as const;
```

## 8. OpenAI Integration

```typescript
// src/features/lifeos/services/ai/scheduler.ai.ts
import OpenAI from 'openai';
import type { SchedulingInput, SchedulingOutput } from '@/specs/001-lifeos-planning/contracts/types';

const openai = new OpenAI();

const SCHEDULING_SCHEMA = {
  type: 'object',
  properties: {
    slots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start_time: { type: 'string' },
          end_time: { type: 'string' },
          slot_type: { type: 'string', enum: ['routine', 'task', 'break', 'buffer'] },
          entity_type: { type: 'string', enum: ['routine_instance', 'task'], nullable: true },
          entity_id: { type: 'string', nullable: true },
          reasoning: { type: 'string' },
          is_locked: { type: 'boolean' },
        },
        required: ['start_time', 'end_time', 'slot_type', 'reasoning', 'is_locked'],
      },
    },
    unplaced_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          entity_id: { type: 'string' },
          entity_type: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['entity_id', 'entity_type', 'reason'],
      },
    },
    optimization_score: { type: 'number' },
  },
  required: ['slots', 'unplaced_items', 'optimization_score'],
};

export async function generateSchedule(input: SchedulingInput): Promise<SchedulingOutput> {
  const systemPrompt = `You are a personal schedule optimizer. Given a user's routines and tasks, create an optimal daily schedule.

Rules:
1. Fixed routines (is_flexible: false) MUST be placed at their exact time slot
2. Flexible routines should be placed at optimal times based on priority
3. Tasks should fill remaining time, prioritized by priority and deadline
4. Add short breaks (5-15 min) between activities
5. Respect wake_time and sleep_time boundaries
6. Provide reasoning for each slot placement`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(input) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'scheduling_output',
        schema: SCHEDULING_SCHEMA,
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from AI');
  
  return JSON.parse(content) as SchedulingOutput;
}
```

## 9. Checklist de Validation

Après implémentation, vérifier :

- [ ] `pnpm build` sans erreurs
- [ ] `npx tsc --noEmit` sans erreurs
- [ ] Migration appliquée sur Supabase
- [ ] Types régénérés
- [ ] Module `lifeos` accessible (après grant via admin)
- [ ] CRUD Domains fonctionnel
- [ ] CRUD Routines fonctionnel
- [ ] CRUD Tasks fonctionnel
- [ ] CRUD Projects fonctionnel
- [ ] Génération planning fonctionnelle
- [ ] Tracking routines fonctionnel
- [ ] Streaks mis à jour
- [ ] Analytics affichées

## 10. Dépendances à Installer

```bash
# Pour la récurrence des routines
pnpm add rrule

# OpenAI (si pas déjà installé)
pnpm add openai
```

---

## Ressources

- **Spec complète**: `specs/001-lifeos-planning/spec.md`
- **Data Model**: `specs/001-lifeos-planning/data-model.md`
- **Research**: `specs/001-lifeos-planning/research.md`
- **Contracts**: `specs/001-lifeos-planning/contracts/`
- **Constitution**: `.specify/memory/constitution.md`

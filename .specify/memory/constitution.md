<!--
SYNC IMPACT REPORT
Version: 2.0.0 → 2.0.1 (PATCH)
Rationale: Validation des templates et clarification du rapport d'impact

Modified Principles:
- None

Added Sections:
- None

Removed Sections:
- None

Templates Status:
- ✅ plan-template.md — Compatible (Technical Context section captures module info)
- ✅ spec-template.md — Compatible (User Story structure supports module features)
- ✅ tasks-template.md — Compatible (Phase 2: Foundational includes shared infra)
- ✅ checklist-template.md — Generic, no constitution-specific requirements
- ✅ agent-file-template.md — Generic, auto-generated from plans

Validation Checklist:
- ✅ No unexplained bracket tokens remaining
- ✅ Dates in ISO format YYYY-MM-DD
- ✅ Principles are declarative and testable
- ✅ Version line matches report
- ✅ All design tokens documented

Follow-up TODOs:
- TODO(COMMANDS): `.specify/templates/commands/` directory not found — create if slash commands needed
-->

# VTT Labs — Constitution

> **Version** : 2.0.1 | **Ratifiée** : 2025-11-25 | **Dernière modification** : 2025-11-29

Ce document définit les règles **non-négociables** du projet VTT Labs. Toute contribution DOIT respecter ces principes. Aucune exception sans amendement formel.

---

## I. Core Stack

### Technologies Obligatoires

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Framework** | Next.js (App Router) | 15.x |
| **Runtime** | React | 19.x |
| **Language** | TypeScript | 5.x (strict mode) |
| **Database** | Supabase Postgres | Latest |
| **Auth** | Supabase Auth | Latest |
| **UI Library** | Shadcn UI | Latest |
| **Styling** | TailwindCSS | 4.x |
| **Validation** | Zod | 3.x |
| **Package Manager** | pnpm | 9.x |

### Tooling

| Outil | Usage |
|-------|-------|
| **Speckit** | Orchestration Spec-Driven Development |
| **MCP Shadcn** | Génération de composants UI |
| **ESLint** | Linting |
| **Prettier** | Formatage |

### Règles Techniques

1. **Server Actions UNIQUEMENT** — Les API Routes sont **interdites**. Toute communication client-serveur passe par des Server Actions.

2. **Row Level Security (RLS)** — DOIT être activé sur toutes les tables contenant des données utilisateur.

3. **TypeScript Strict** — Le mode strict est obligatoire. `any` est interdit sauf justification exceptionnelle documentée.

4. **Supabase RPC/Views** — Les mutations complexes utilisent des RPCs. Les queries complexes utilisent des Views.

---

## II. Code Architecture

### Structure Racine

```
vtt-labs/
├── src/
│   ├── app/                    # Routing Next.js UNIQUEMENT
│   │   ├── (marketing)/        # Pages publiques (landing, legal)
│   │   ├── (auth)/             # Authentification
│   │   └── (dashboard)/        # Applications du lab (protégées)
│   │       └── [module]/       # Routes par module
│   │
│   ├── features/               # Logique métier isolée par module
│   │   ├── [module-name]/
│   │   │   ├── components/     # Composants React du module
│   │   │   ├── actions/        # Server Actions du module
│   │   │   ├── services/       # Business logic pure
│   │   │   └── schema/         # Schémas Zod
│   │   └── shared/             # Code partagé entre modules
│   │
│   ├── components/
│   │   ├── ui/                 # Composants Shadcn (NE PAS MODIFIER)
│   │   └── shared/             # Composants cross-app
│   │
│   └── lib/
│       ├── supabase/           # Client, helpers, types générés
│       └── utils/              # Utilitaires partagés
│
├── supabase/
│   └── migrations/             # Schéma DB versionné
│
└── .specify/                   # Artefacts Spec-Driven Development
```

### Règles d'Architecture

1. **Isolation des Modules** — Chaque module dans `features/` est autonome. Un module NE DOIT PAS importer directement depuis un autre module. Utiliser `features/shared/` pour le code commun.

2. **App Directory = Routing Only** — Le dossier `app/` contient UNIQUEMENT le routing, layouts et pages. AUCUNE logique métier.

3. **Feature Structure Obligatoire** — Chaque module DOIT contenir :
   - `components/` — Composants React spécifiques
   - `actions/` — Server Actions (point d'entrée serveur)
   - `services/` — Logique métier pure (testable, sans dépendances Next.js)
   - `schema/` — Schémas Zod pour validation

4. **Database in Migrations Only** — Les définitions de tables, RPCs, Views et Policies existent UNIQUEMENT dans `supabase/migrations/`.

---

## III. UI & UX Principles

### Design System : Linear-Style + Red Signature

VTT Labs adopte un design system inspiré de **Linear** avec le **rouge comme couleur signature**.

#### Principes Fondamentaux

| Principe | Règle |
|----------|-------|
| **Mode** | Dark par défaut, Light mode disponible |
| **Densité** | Haute — Maximiser l'information visible |
| **Typographie** | Inter (UI), Geist Mono (code) |
| **Radius** | Petit — `rounded-md` (6px) par défaut |
| **Animations** | Subtiles, 150ms ease, jamais bloquantes |
| **Accessibilité** | WCAG 2.1 AA minimum |

#### États UI Obligatoires

Chaque composant affichant des données DOIT gérer ces états :

| État | Implémentation |
|------|----------------|
| **Loading** | Skeleton components (jamais de spinner bloquant) |
| **Empty** | Message clair + illustration + CTA |
| **Error** | Message d'erreur + action de retry |
| **Success** | Toast non-bloquant |

#### Navigation

1. **Sidebar** — Navigation principale, collapsible, avec icônes et labels
2. **Command Palette** — Accessible via `⌘K` / `Ctrl+K`, recherche globale obligatoire
3. **Breadcrumbs** — Pour toute navigation à plus de 2 niveaux de profondeur

#### Interdictions

- ❌ `alert()`, `confirm()`, `prompt()` — Utiliser Dialog/Toast
- ❌ Spinners bloquant l'UI entière
- ❌ Couleurs hors palette sans justification
- ❌ Border-radius > 12px (sauf avatars)

---

## IV. Server-Side Logic

### Server Actions

Les Server Actions sont le **seul point d'entrée** pour les mutations client-serveur.

```typescript
// ✅ Pattern obligatoire
export async function createGoal(input: CreateGoalInput): Promise<ActionResult<Goal>> {
  // 1. Validation Zod
  const validated = createGoalSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.message };
  }
  
  // 2. Appel service
  const result = await goalService.create(validated.data);
  
  // 3. Retour standardisé
  return result;
}
```

**Règles :**
1. Toujours valider avec Zod en premier
2. Déléguer la logique au service
3. Ne JAMAIS contenir de logique métier directe
4. Retourner `{ data, error }` systématiquement

### Services

Les services contiennent la logique métier pure.

**Règles :**
1. Aucune dépendance Next.js (pas de `cookies()`, `headers()`, etc.)
2. Fonctions pures et testables
3. Appellent Supabase RPCs pour les mutations
4. Gestion d'erreur explicite

---

## V. Performance

### Backend

1. **Single RPC over Multiple Queries** — Privilégier un RPC puissant plutôt que plusieurs requêtes simples
2. **Views for Complex Reads** — Utiliser des Views PostgreSQL pour les jointures complexes
3. **Indexes** — Tout champ utilisé en WHERE ou ORDER BY doit être indexé

### Frontend

1. **Server Components First** — Utiliser `"use client"` uniquement quand l'interactivité est essentielle
2. **Image Optimization** — Toutes les images via `next/image`
3. **Font Optimization** — Toutes les fonts via `next/font`
4. **Code Splitting** — Les modules chargent leur code à la demande

### Métriques Cibles

| Métrique | Cible |
|----------|-------|
| **LCP** | < 2.5s |
| **FID** | < 100ms |
| **CLS** | < 0.1 |
| **Time to Interactive** | < 3s |

---

## VI. Error Handling & User Feedback

### Pattern de Réponse Standardisé

Toutes les Server Actions DOIVENT retourner ce type :

```typescript
type ActionResult<T> = {
  data: T | null;
  error: string | null;
};
```

### Feedback Utilisateur

| Type | Composant | Couleur |
|------|-----------|---------|
| **Success** | Toast | `emerald-500` |
| **Error** | Toast | `orange-500` ⚠️ (PAS rouge, évite confusion avec accent) |
| **Warning** | Toast | `amber-500` |
| **Info** | Toast | `blue-500` |
| **Destructive Confirm** | AlertDialog | `red-500` (accent) |

### Règles

1. **Toasts pour feedback temporaire** — Disparaissent après 5s
2. **AlertDialog pour actions destructives** — Confirmation explicite requise
3. **Inline errors pour formulaires** — Afficher sous le champ concerné
4. **Never silent failures** — Toute erreur doit être communiquée à l'utilisateur

---

## VII. Code Quality & Consistency

### Réutilisabilité

1. **DRY Strict** — Code dupliqué = refactor immédiat en utility/hook/component
2. **Shared Features** — Code commun entre modules dans `features/shared/`
3. **UI Components** — Composants génériques dans `components/shared/`

### Formatage & Linting

| Outil | Configuration |
|-------|---------------|
| **ESLint** | Config Next.js + règles custom |
| **Prettier** | Obligatoire, format on save |
| **TypeScript** | Strict mode, no implicit any |

### Conventions de Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| **Fichiers composants** | kebab-case | `goal-card.tsx` |
| **Fichiers utils** | kebab-case | `date-utils.ts` |
| **Composants** | PascalCase | `GoalCard` |
| **Fonctions/Variables** | camelCase | `createGoal` |
| **Types/Interfaces** | PascalCase | `Goal`, `CreateGoalInput` |
| **Constants** | SCREAMING_SNAKE | `MAX_GOALS_PER_USER` |
| **Tables DB** | snake_case + préfixe module | `okr_goals`, `finance_transactions` |

---

## VIII. Data Model & Access Control

### Modèle Utilisateur

VTT Labs utilise un modèle **Multi-User avec Partage Sélectif**.

```
┌─────────────────────────────────────────────────────────────┐
│  • Chaque utilisateur a ses propres données (isolées)       │
│  • Le partage entre utilisateurs est explicite et granulaire│
│  • Un admin gère l'accès aux modules par utilisateur        │
└─────────────────────────────────────────────────────────────┘
```

### Rôles

| Rôle | Permissions |
|------|-------------|
| **admin** | Accès complet + gestion des accès modules |
| **user** | Accès aux modules autorisés uniquement |

### Tables Système Obligatoires

```sql
-- Profils utilisateurs (étend auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Accès aux modules par utilisateur
CREATE TABLE user_module_access (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES profiles(id),
  PRIMARY KEY (user_id, module_slug)
);

-- Partage de ressources entre utilisateurs
CREATE TABLE shared_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  shared_with_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, resource_type, resource_id, shared_with_id)
);
```

### Règles de Données

1. **user_id Obligatoire** — Toute table de données module DOIT avoir :
   ```sql
   user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   ```

2. **RLS Pattern Standard** :
   ```sql
   -- Accès aux données personnelles
   CREATE POLICY "Users access own data" ON [table]
     FOR ALL USING (user_id = auth.uid());
   
   -- Accès aux données partagées (lecture)
   CREATE POLICY "Users access shared data" ON [table]
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM shared_access
         WHERE owner_id = [table].user_id
           AND resource_type = '[type]'
           AND (resource_id IS NULL OR resource_id = [table].id)
           AND shared_with_id = auth.uid()
       )
     );
   ```

3. **Préfixe Tables par Module** — Format : `[module]_[entity]`
   - `okr_goals`, `okr_routines`
   - `finance_transactions`, `finance_budgets`
   - `agents_configs`, `agents_conversations`

---

## IX. Module Architecture

### Philosophie

VTT Labs est conçu pour accueillir un **nombre illimité de modules**.

```
╔════════════════════════════════════════════════════════╗
║  Chaque nouvelle idée = Un nouveau module              ║
║  Pas de limite au nombre de modules                    ║
║  Modules indépendants mais interconnectables           ║
╚════════════════════════════════════════════════════════╝
```

### Création d'un Nouveau Module

Tout nouveau module DOIT :

1. **Avoir un slug unique** — Identifiant kebab-case (`okr`, `finance`, `ai-agents`)

2. **Suivre la structure standard** :
   ```
   features/[module-slug]/
   ├── components/     # Composants React
   ├── actions/        # Server Actions
   ├── services/       # Business logic
   └── schema/         # Schémas Zod
   ```

3. **Avoir ses tables préfixées** — `[module]_[entity]`

4. **Être enregistré** — Slug ajouté à la liste des modules connus

5. **Avoir une couleur d'accent** — Définie et unique

### Couleurs par Module

| Module | Slug | Couleur | Code |
|--------|------|---------|------|
| Core/Auth | `core` | Rouge (signature) | `red-500` |
| OKR & Routines | `okr` | Orange | `orange-500` |
| Finance | `finance` | Emeraude | `emerald-500` |
| Agents IA | `ai-agents` | Violet | `violet-500` |
| Chat | `chat` | Ambre | `amber-500` |
| Health | `health` | Rose | `pink-500` |
| Notes | `notes` | Indigo | `indigo-500` |
| Learning | `learning` | Cyan | `cyan-500` |
| *Nouveau* | *[slug]* | *Non utilisée* | *[color]-500* |

---

## X. Design System Tokens

### Couleurs — Mode Dark (Défaut)

```css
/* ═══════════════════════════════════════════════════════════
   VTT LABS — RED SIGNATURE DESIGN TOKENS
   ═══════════════════════════════════════════════════════════ */

/* Background */
--background:           #09090B;  /* zinc-950 — App background */
--background-card:      #18181B;  /* zinc-900 — Cards, panels */
--background-elevated:  #27272A;  /* zinc-800 — Dropdowns, popovers */
--background-hover:     #3F3F46;  /* zinc-700 — Hover states */

/* Text */
--text-primary:         #FAFAFA;  /* zinc-50 — Primary text */
--text-secondary:       #A1A1AA;  /* zinc-400 — Secondary text */
--text-muted:           #71717A;  /* zinc-500 — Muted/disabled text */
--text-inverted:        #09090B;  /* zinc-950 — Text on light bg */

/* Borders */
--border:               #27272A;  /* zinc-800 — Default border */
--border-subtle:        #18181B;  /* zinc-900 — Subtle border */
--border-strong:        #3F3F46;  /* zinc-700 — Emphasized border */

/* ═══════════════════════════════════════════════════════════
   ACCENT — RED SIGNATURE
   ═══════════════════════════════════════════════════════════ */
--accent:               #EF4444;  /* red-500 — Primary accent */
--accent-hover:         #DC2626;  /* red-600 — Hover state */
--accent-active:        #B91C1C;  /* red-700 — Active/pressed */
--accent-subtle:        #7F1D1D;  /* red-900 — Subtle backgrounds */
--accent-foreground:    #FAFAFA;  /* White text on accent */

/* Focus Ring */
--ring:                 #EF4444;  /* red-500 */
--ring-offset:          #09090B;  /* background */

/* ═══════════════════════════════════════════════════════════
   SEMANTIC COLORS
   ═══════════════════════════════════════════════════════════ */
--success:              #10B981;  /* emerald-500 */
--success-subtle:       #065F46;  /* emerald-800 */

--warning:              #F59E0B;  /* amber-500 */
--warning-subtle:       #92400E;  /* amber-800 */

--error:                #F97316;  /* orange-500 — NOT red (avoid accent confusion) */
--error-subtle:         #9A3412;  /* orange-800 */

--info:                 #3B82F6;  /* blue-500 */
--info-subtle:          #1E40AF;  /* blue-800 */

/* ═══════════════════════════════════════════════════════════
   MODULE ACCENT COLORS
   ═══════════════════════════════════════════════════════════ */
--module-okr:           #F97316;  /* orange-500 */
--module-finance:       #10B981;  /* emerald-500 */
--module-agents:        #8B5CF6;  /* violet-500 */
--module-chat:          #F59E0B;  /* amber-500 */
--module-health:        #EC4899;  /* pink-500 */
--module-notes:         #6366F1;  /* indigo-500 */
--module-learning:      #06B6D4;  /* cyan-500 */
```

### Typographie

```css
/* Font Family */
--font-sans:            'Inter', system-ui, sans-serif;
--font-mono:            'Geist Mono', ui-monospace, monospace;

/* Font Sizes */
--text-xs:              0.75rem;    /* 12px */
--text-sm:              0.875rem;   /* 14px */
--text-base:            1rem;       /* 16px */
--text-lg:              1.125rem;   /* 18px */
--text-xl:              1.25rem;    /* 20px */
--text-2xl:             1.5rem;     /* 24px */
--text-3xl:             1.875rem;   /* 30px */

/* Font Weights */
--font-normal:          400;
--font-medium:          500;
--font-semibold:        600;
--font-bold:            700;

/* Line Heights */
--leading-tight:        1.25;
--leading-normal:       1.5;
--leading-relaxed:      1.625;
```

### Spacing

```css
/* Base unit: 4px */
--space-0:              0;
--space-1:              0.25rem;    /* 4px */
--space-2:              0.5rem;     /* 8px */
--space-3:              0.75rem;    /* 12px */
--space-4:              1rem;       /* 16px */
--space-5:              1.25rem;    /* 20px */
--space-6:              1.5rem;     /* 24px */
--space-8:              2rem;       /* 32px */
--space-10:             2.5rem;     /* 40px */
--space-12:             3rem;       /* 48px */
```

### Border Radius

```css
--radius-none:          0;
--radius-sm:            0.25rem;    /* 4px */
--radius-md:            0.375rem;   /* 6px — Default */
--radius-lg:            0.5rem;     /* 8px */
--radius-xl:            0.75rem;    /* 12px */
--radius-2xl:           1rem;       /* 16px */
--radius-full:          9999px;     /* Pills, avatars */
```

### Shadows

```css
--shadow-sm:            0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md:            0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg:            0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-accent:        0 0 0 3px rgba(239, 68, 68, 0.15);  /* Red glow */
```

### Transitions

```css
--transition-fast:      100ms ease;
--transition-base:      150ms ease;
--transition-slow:      300ms ease;
--transition-slower:    500ms ease;
```

---

## Governance

### Amendements

1. Toute modification de cette constitution requiert :
   - Justification documentée
   - Revue par le mainteneur principal
   - Mise à jour du numéro de version

2. **Versioning Sémantique** :
   - **MAJOR** : Changement incompatible (principe supprimé/redéfini)
   - **MINOR** : Nouveau principe ou section ajoutée
   - **PATCH** : Clarification, correction, reformulation

### Conformité

- Tout code DOIT être conforme avant merge
- Les revues de code DOIVENT vérifier la conformité
- Les violations DOIVENT être corrigées ou justifiées par un amendement

---

## Changelog

### v2.0.1 (2025-11-29)
- **PATCH** : Validation des templates et mise à jour du rapport d'impact
- **VALIDATED** : Tous les templates sont compatibles avec la constitution v2.0.0
- **NOTE** : Dossier `.specify/templates/commands/` non trouvé — à créer si nécessaire

### v2.0.0 (2025-11-29)
- **BREAKING** : Refonte complète pour architecture multi-app extensible
- **ADDED** : Section VIII — Data Model & Access Control (Multi-User + Partage)
- **ADDED** : Section IX — Module Architecture (Extensibilité infinie)
- **ADDED** : Section X — Design System Tokens (Red Signature)
- **CHANGED** : UI/UX avec design system Linear + Red complet
- **CHANGED** : Erreurs utilisent `orange-500` au lieu de rouge
- **CHANGED** : Conventions de nommage détaillées

### v1.1.0 (2025-11-25)
- Version initiale documentée

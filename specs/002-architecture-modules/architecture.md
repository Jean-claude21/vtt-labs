# Architecture Modules VTT Labs - LifeOS

> Document de référence établi le 16 décembre 2025  
> Dernière mise à jour : 16 décembre 2025

---

## 1. Vue d'ensemble

### 1.1 Architecture globale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VTT LABS - LIFEOS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         SIDEBAR                                   │   │
│  │  🏠 Accueil (Today View)                                         │   │
│  │  ─── ESPACES ────                                                │   │
│  │  📊 [Dashboard custom 1]                                         │   │
│  │  📊 [Dashboard custom 2]                                         │   │
│  │  + Nouveau espace                                                │   │
│  │  ─── MODULES ────                                                │   │
│  │  📅 Planning ▶                                                   │   │
│  │  🎯 OKR ▶                                                        │   │
│  │  📓 Journal ▶                                                    │   │
│  │  💰 Finance ▶                                                    │   │
│  │  ─── SYSTÈME ────                                                │   │
│  │  🧩 Galerie widgets                                              │   │
│  │  ⚙️ Paramètres                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│                    ┌─────────────────────────────┐                       │
│                    │      NOYAU (CORE)           │                       │
│                    │  - Espaces & Widgets        │                       │
│                    │  - Entity Links             │                       │
│                    │  - Module Registry          │                       │
│                    └─────────────┬───────────────┘                       │
│                                  │                                       │
│         ┌────────────────────────┼────────────────────────┐              │
│         │                        │                        │              │
│         ▼                        ▼                        ▼              │
│  ┌─────────────┐         ┌─────────────┐          ┌─────────────┐       │
│  │   MODULE    │         │   MODULE    │          │   MODULE    │       │
│  │   OKR       │◄───────►│  PLANNING   │◄────────►│   JOURNAL   │       │
│  │ (Stratégie) │         │(Opérationnel)│          │ (Réflexion) │       │
│  └─────────────┘         └─────────────┘          └─────────────┘       │
│                                                                          │
│                          ┌─────────────┐                                 │
│                          │   MODULE    │                                 │
│                          │   FINANCE   │                                 │
│                          │  (Budgets)  │                                 │
│                          └─────────────┘                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Structure de la Sidebar

```
VTT LABS
│
├── 🏠 Accueil                    ← Auto-généré (Today view intelligente)
│
├── ─── ESPACES ────────          ← Dashboards personnalisables
│   ├── 📊 [Dashboard custom 1]   ← Widgets configurables
│   ├── 📊 [Dashboard custom 2]
│   └── + Nouveau espace
│
├── ─── MODULES ────────          ← Fonctionnalités principales
│   ├── 📅 Planning ▶
│   │   ├── Calendrier            ← Page par défaut
│   │   ├── Tâches
│   │   ├── Routines
│   │   ├── Projets
│   │   └── Statistiques
│   │
│   ├── 🎯 OKR ▶
│   │   ├── Vue globale           ← Page par défaut
│   │   ├── Objectifs
│   │   ├── Check-ins
│   │   └── Reviews
│   │
│   ├── 📓 Journal ▶ (futur)
│   │   ├── Entrées
│   │   ├── Gratitudes
│   │   └── Prompts
│   │
│   └── 💰 Finance ▶ (futur)
│       ├── Transactions
│       ├── Budgets
│       └── Objectifs
│
├── ─── SYSTÈME ────────
│   ├── 🧩 Galerie widgets        ← Tous les widgets disponibles
│   └── ⚙️ Paramètres
│
└── 👤 [User menu footer]
```

### 1.3 Concepts clés

| Concept | Définition | Exemple |
|---------|------------|---------|
| **Accueil** | Vue "Today" intelligente, auto-générée | Routines du jour + Tâches dues + KR à risque |
| **Espace** | Dashboard personnalisable avec widgets | "Morning Review" avec météo OKR + routines + journal |
| **Module** | Fonctionnalité complète avec ses pages | Planning (Calendrier, Tâches, Routines...) |
| **Widget** | Bloc de données affichable n'importe où | "Streak counter", "KR Progress", "Today's Tasks" |
| **Noyau** | Infrastructure de connexion inter-modules | Entity links, widget registry |

---

## 2. Définitions

### 2.1 Module

Un **module** est une unité fonctionnelle **grande et autonome** qui :
- A sa propre base de données (tables préfixées)
- A sa propre UI (pages, composants)
- Peut fonctionner indépendamment
- Expose des données/widgets aux autres modules via le Noyau

**Exemples de modules :**
| Module | Préfixe tables | Rôle |
|--------|----------------|------|
| Planning | `lifeos_` | Gestion opérationnelle (tâches, routines, projets) |
| OKR | `lifeos_okr_` | Gestion stratégique (objectifs, résultats clés) |
| Journal | `lifeos_journal_` | Réflexion et introspection |
| Finance | `lifeos_finance_` | Budgets, transactions, objectifs financiers |

**Ce qui n'est PAS un module séparé :**
- Tâches seules → Fait partie de Planning
- Routines seules → Fait partie de Planning
- Domaines → Simple catégorisation transverse

### 2.2 Noyau (Core)

Le **noyau** est l'infrastructure centrale qui permet :
1. **Connexion inter-modules** : Lier une entité d'un module à une autre
2. **Registre de modules** : Savoir quels modules existent et ce qu'ils exposent
3. **Système de widgets** : Permettre à un module d'afficher des données d'un autre

**Tables du noyau :**

```sql
-- Registre des modules installés
core_modules (
    slug TEXT PRIMARY KEY,        -- 'planning', 'okr', 'journal'
    name TEXT,                    -- 'Planning', 'OKR', 'Journal'
    icon TEXT,                    -- 'calendar', 'target', 'book'
    color TEXT,                   -- '#3B82F6'
    exposed_types TEXT[],         -- ['task', 'routine', 'project']
    accepts_links_from TEXT[],    -- Quels types peuvent le cibler
    provides_widgets TEXT[],      -- ['streak-widget', 'progress-widget']
    is_enabled BOOLEAN
)

-- Liens entre entités de différents modules
core_entity_links (
    id UUID PRIMARY KEY,
    user_id UUID,
    
    -- Source
    source_module TEXT,           -- 'okr'
    source_type TEXT,             -- 'key_result'
    source_id UUID,
    
    -- Cible
    target_module TEXT,           -- 'planning'
    target_type TEXT,             -- 'routine_template'
    target_id UUID,
    
    -- Métadonnées
    link_type TEXT,               -- 'tracks', 'generates', 'references'
    config JSONB,                 -- { auto_sync: true, sync_mode: 'completion' }
    created_at TIMESTAMPTZ
)

-- Configuration utilisateur des connexions entre modules
core_module_connections (
    user_id UUID,
    source_module TEXT,
    target_module TEXT,
    is_enabled BOOLEAN,
    config JSONB
)
```

**Le noyau n'a de sens que quand il y a 2+ modules à connecter.**

### 2.3 Widget

Un **widget** est un composant UI réutilisable qui :
- Affiche des données d'un module
- Peut être placé dans le Dashboard ou dans un autre module
- Est déclaré par le module source dans `provides_widgets`

**Exemples de widgets :**
| Widget | Module source | Affiche |
|--------|---------------|---------|
| `streak-card` | Planning | Séries en cours |
| `okr-progress` | OKR | Progression des Key Results |
| `today-routines` | Planning | Routines du jour |
| `journal-prompt` | Journal | Question de réflexion du jour |
| `budget-summary` | Finance | Résumé budget mensuel |

---

## 3. Modules détaillés

### 3.1 Module Planning (EXISTANT ✅)

**Statut : 85% complet**

**Tables :**
```
lifeos_domains              ✅ 8 domaines par défaut
lifeos_projects             ✅ Backend complet, UI incomplète
lifeos_tasks                ✅ Complet
lifeos_routine_templates    ✅ Complet
lifeos_routine_instances    ✅ Complet
lifeos_routine_instance_tasks ✅ Complet
lifeos_streaks              ✅ Complet
lifeos_generated_plans      ✅ Complet
lifeos_plan_slots           ✅ Complet
```

**UI existante :**
- ✅ Calendrier (jour/semaine/mois)
- ✅ Liste des routines
- ✅ Gestion des tâches
- ❌ UI Projets (formulaires, détail, progression)

**Fonctionnalités :**
- Planification quotidienne/hebdomadaire
- Routines récurrentes avec checklist
- Suivi des séries (streaks)
- Génération automatique de plan

### 3.2 Module OKR (À CRÉER 🔨)

**Tables proposées :**
```sql
lifeos_okr_cycles (
    id UUID PRIMARY KEY,
    user_id UUID,
    name TEXT,                    -- "Année 2026", "Q1 2026"
    type TEXT,                    -- 'vision' | 'multi_year' | 'annual' | 'quarterly' | 'monthly'
    start_date DATE,
    end_date DATE,
    parent_cycle_id UUID,         -- Hiérarchie : Année → Trimestre → Mois
    created_at TIMESTAMPTZ
)

lifeos_okr_themes (
    id UUID PRIMARY KEY,
    user_id UUID,
    name TEXT,                    -- "Caractère", "Consécration", "Service"
    description TEXT,
    color TEXT,
    icon TEXT,
    position INT,
    domain_id UUID                -- Lien optionnel vers lifeos_domains
)

lifeos_okr_objectives (
    id UUID PRIMARY KEY,
    user_id UUID,
    cycle_id UUID,
    theme_id UUID,
    parent_objective_id UUID,     -- Cascade : Vision → Stratégique → Tactique
    title TEXT,
    description TEXT,
    objective_type TEXT,          -- 'vision' | 'strategic' | 'tactical'
    status TEXT,                  -- 'draft' | 'active' | 'completed' | 'abandoned'
    position INT,
    created_at TIMESTAMPTZ
)

lifeos_okr_key_results (
    id UUID PRIMARY KEY,
    user_id UUID,
    objective_id UUID,
    title TEXT,
    description TEXT,
    
    -- Mesure
    metric_type TEXT,             -- 'number' | 'percentage' | 'currency' | 'boolean' | 'milestone'
    target_value DECIMAL,
    current_value DECIMAL DEFAULT 0,
    unit TEXT,                    -- 'jours', 'heures', '€', '%'
    
    -- Scoring
    scoring_method TEXT,          -- 'linear' | 'binary' | 'milestone'
    confidence_level INT,         -- 0-100 (🔴🟡🟢)
    
    -- Tracking
    track_mode TEXT,              -- 'manual' | 'auto_from_routine' | 'auto_from_task'
    
    status TEXT,
    position INT,
    created_at TIMESTAMPTZ
)

lifeos_okr_milestones (
    id UUID PRIMARY KEY,
    key_result_id UUID,
    title TEXT,
    target_date DATE,
    target_value DECIMAL,         -- Valeur attendue à ce jalon
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    position INT
)

lifeos_okr_initiatives (
    id UUID PRIMARY KEY,
    user_id UUID,
    key_result_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,                  -- 'not_started' | 'in_progress' | 'completed' | 'blocked'
    
    -- Liens vers Planning (via core_entity_links ou directement)
    linked_task_id UUID,
    linked_routine_id UUID,
    linked_project_id UUID,
    
    position INT,
    created_at TIMESTAMPTZ
)

lifeos_okr_check_ins (
    id UUID PRIMARY KEY,
    user_id UUID,
    
    -- Peut être sur un cycle, objectif ou KR
    entity_type TEXT,             -- 'cycle' | 'objective' | 'key_result'
    entity_id UUID,
    
    check_in_date DATE,
    
    -- Contenu
    progress_note TEXT,
    blockers TEXT,
    next_actions TEXT,
    confidence_update INT,        -- Nouvelle estimation
    mood INT,                     -- 1-5
    
    created_at TIMESTAMPTZ
)

lifeos_okr_progress_logs (
    id UUID PRIMARY KEY,
    key_result_id UUID,
    logged_at TIMESTAMPTZ,
    previous_value DECIMAL,
    new_value DECIMAL,
    change_source TEXT,           -- 'manual' | 'routine_completion' | 'task_completion'
    source_entity_id UUID,        -- ID de la routine/tâche qui a déclenché
    notes TEXT
)
```

**Intégration avec Planning :**
- Un Key Result peut être lié à une Routine → complétion incrémente automatiquement
- Une Initiative peut générer des Tâches
- Un Objectif peut être lié à un Projet

**UI prévue :**
- Vue "My OKRs" avec arbre Objectifs → KR → Initiatives
- Dashboard OKR avec progression globale
- Vue Check-in hebdomadaire
- Scoring visuel (🟢🟡🔴)

### 3.3 Module Journal (FUTUR 📝)

**Tables proposées :**
```sql
lifeos_journal_entries (
    id UUID PRIMARY KEY,
    user_id UUID,
    entry_date DATE,
    title TEXT,
    content TEXT,                 -- Markdown
    mood INT,                     -- 1-5
    energy INT,                   -- 1-5
    entry_type TEXT,              -- 'daily' | 'weekly' | 'reflection' | 'gratitude'
    is_private BOOLEAN,
    created_at TIMESTAMPTZ
)

lifeos_journal_prompts (
    id UUID PRIMARY KEY,
    user_id UUID,                 -- NULL = prompts système
    question TEXT,
    category TEXT,                -- 'morning' | 'evening' | 'weekly' | 'gratitude'
    is_active BOOLEAN
)

lifeos_journal_gratitudes (
    id UUID PRIMARY KEY,
    user_id UUID,
    entry_id UUID,
    content TEXT,
    category TEXT,                -- 'people' | 'experiences' | 'things' | 'self'
    created_at TIMESTAMPTZ
)

lifeos_journal_tags (
    id UUID PRIMARY KEY,
    user_id UUID,
    name TEXT,
    color TEXT
)

lifeos_journal_entry_tags (
    entry_id UUID,
    tag_id UUID,
    PRIMARY KEY (entry_id, tag_id)
)
```

**Intégration :**
- Lier une entrée à un Objectif OKR (réflexion sur progression)
- Lier une entrée à une Routine complétée (journaling post-routine)
- Widget "Prompt du jour" sur Dashboard

### 3.4 Module Finance (FUTUR 💰)

**Tables proposées :**
```sql
lifeos_finance_accounts (
    id UUID PRIMARY KEY,
    user_id UUID,
    name TEXT,                    -- "Compte courant", "Épargne"
    type TEXT,                    -- 'checking' | 'savings' | 'credit' | 'investment'
    currency TEXT DEFAULT 'EUR',
    initial_balance DECIMAL,
    current_balance DECIMAL,
    is_active BOOLEAN
)

lifeos_finance_categories (
    id UUID PRIMARY KEY,
    user_id UUID,
    name TEXT,
    type TEXT,                    -- 'income' | 'expense'
    icon TEXT,
    color TEXT,
    parent_category_id UUID,
    budget_default DECIMAL
)

lifeos_finance_transactions (
    id UUID PRIMARY KEY,
    user_id UUID,
    account_id UUID,
    category_id UUID,
    amount DECIMAL,
    type TEXT,                    -- 'income' | 'expense' | 'transfer'
    description TEXT,
    transaction_date DATE,
    is_recurring BOOLEAN,
    recurring_id UUID,
    created_at TIMESTAMPTZ
)

lifeos_finance_budgets (
    id UUID PRIMARY KEY,
    user_id UUID,
    category_id UUID,
    amount DECIMAL,
    period TEXT,                  -- 'monthly' | 'quarterly' | 'yearly'
    start_date DATE,
    end_date DATE
)

lifeos_finance_goals (
    id UUID PRIMARY KEY,
    user_id UUID,
    name TEXT,                    -- "Fonds d'urgence", "Vacances"
    target_amount DECIMAL,
    current_amount DECIMAL,
    target_date DATE,
    linked_account_id UUID,
    status TEXT
)
```

**Intégration :**
- Lier un Goal Finance à un Objectif OKR
- Widget "Budget du mois" sur Dashboard

---

## 4. Système d'Espaces et Widgets

### 4.1 Tables Espaces

```sql
-- Espaces (dashboards personnalisés)
CREATE TABLE core_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,              -- URL-friendly
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, slug)
);

-- Widgets placés dans un espace
CREATE TABLE core_space_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES core_spaces(id) ON DELETE CASCADE,
    widget_type TEXT NOT NULL,       -- 'routine-today', 'okr-progress', 'streak-card'
    
    -- Position dans la grille (grid layout)
    grid_x INT DEFAULT 0,
    grid_y INT DEFAULT 0,
    grid_w INT DEFAULT 1,            -- Largeur en colonnes (1-4)
    grid_h INT DEFAULT 1,            -- Hauteur en lignes (1-4)
    
    -- Configuration spécifique au widget
    config JSONB DEFAULT '{}',       -- { domainFilter: [...], showCompleted: false }
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Registre des widgets disponibles
CREATE TABLE core_widget_registry (
    slug TEXT PRIMARY KEY,           -- 'routine-today'
    name TEXT NOT NULL,              -- 'Routines du jour'
    description TEXT,
    module TEXT NOT NULL,            -- 'planning'
    component_name TEXT NOT NULL,    -- 'RoutineTodayWidget'
    min_width INT DEFAULT 1,
    min_height INT DEFAULT 1,
    max_width INT DEFAULT 4,
    max_height INT DEFAULT 4,
    default_config JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT true
);
```

### 4.2 Widgets par module

| Module | Widget | Description | Taille par défaut |
|--------|--------|-------------|-------------------|
| Planning | `routine-today` | Routines du jour avec statut | 2x2 |
| Planning | `tasks-due` | Tâches dues aujourd'hui | 2x1 |
| Planning | `streak-card` | Séries actives | 1x1 |
| Planning | `weekly-progress` | Progression semaine | 2x1 |
| OKR | `okr-summary` | Résumé objectifs en cours | 2x2 |
| OKR | `kr-at-risk` | Key Results à risque | 2x1 |
| OKR | `confidence-meter` | Jauge de confiance globale | 1x1 |
| Journal | `daily-prompt` | Question du jour | 2x1 |
| Journal | `gratitude-streak` | Série gratitudes | 1x1 |
| Finance | `budget-status` | État du budget mensuel | 2x1 |
| Finance | `goal-progress` | Progression objectifs | 2x1 |

### 4.3 Vue Accueil (Today View)

La vue Accueil est **auto-générée** et affiche :

```
┌─────────────────────────────────────────────────────────────────┐
│  Bonjour [Prénom] 👋              [Date du jour]                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⏰ PROCHAINE ROUTINE                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🙏 [Nom routine]    [Heure]    [Commencer]                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  📋 TÂCHES AUJOURD'HUI (N)                                      │
│  ☐ [Tâche 1]                                   Due: [Heure]     │
│  ☐ [Tâche 2]                                   Due: [Heure]     │
│                                                                  │
│  🎯 OKR À RISQUE (si module OKR actif)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔴 KR: [Titre]   ([current]/[target])   Retard: [jours]     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  🔥 STREAKS ACTIFS                                              │
│  [Routine 1]: N jours 🔥   [Routine 2]: N jours 🔥              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Ordre d'implémentation recommandé

### Phase 0 - Nettoyage & UX (Priorité immédiate)

```
PHASE 0 - Refonte Sidebar & UX (2-3h avec IA)
├── 0.1 Nettoyer sidebar (supprimer Storage/Todo/Médias)
├── 0.2 Restructurer en Accueil / Espaces / Modules / Système
├── 0.3 Créer composant PageHeader unifié
├── 0.4 Renommer routes /app/lifeos → /app/planning
└── 0.5 Ajouter breadcrumbs et navigation cohérente
```

### Phase 1 - Module OKR (Critique pour planification 2026)

```
PHASE 1 - Module OKR Complet (8-12h avec IA)
├── 1.1 Migration SQL (cycles, themes, objectives, key_results, etc.)
├── 1.2 Services CRUD (okr.actions.ts, okr.service.ts)
├── 1.3 Sidebar: Ajouter entrée OKR
├── 1.4 UI: Page liste objectifs avec arbre O → KR
├── 1.5 UI: Formulaires création/édition
├── 1.6 UI: Vue Check-in hebdomadaire
├── 1.7 UI: Dashboard OKR avec progression
└── 1.8 Seed données 2026 (cycles année + trimestres)
```

### Phase 2 - Noyau Core & Intégration

```
PHASE 2 - Noyau Core (4-6h avec IA)
├── 2.1 Tables core_entity_links, core_spaces, core_space_widgets
├── 2.2 Service EntityLinkService
├── 2.3 Composant EntityPicker (sélectionner entité cross-module)
├── 2.4 Intégration OKR ↔ Planning (KR lié à Routine)
└── 2.5 Triggers auto-sync (complétion routine → incrémente KR)
```

### Phase 3 - Système de Widgets & Espaces

```
PHASE 3 - Espaces & Widgets (4-6h avec IA)
├── 3.1 Table core_widget_registry + seed widgets
├── 3.2 Composant WidgetGrid (react-grid-layout)
├── 3.3 Page Galerie Widgets
├── 3.4 CRUD Espaces (créer, renommer, supprimer)
├── 3.5 Widgets Planning: routine-today, tasks-due, streak-card
├── 3.6 Widgets OKR: okr-summary, kr-at-risk
└── 3.7 Vue Accueil (Today View auto-générée)
```

### Phase 4 - Finaliser Planning

```
PHASE 4 - Compléter Planning (2-4h avec IA)
├── 4.1 UI Projets (formulaire création/édition)
├── 4.2 Page détail Projet avec tâches liées
├── 4.3 Calcul et affichage progression
└── 4.4 Vue Gantt basique (optionnel)
```

### Phases futures

```
PHASE 5 - Module Journal (6-8h avec IA)
PHASE 6 - Module Finance (8-10h avec IA)
```

---

## 6. Flux de données entre modules

### Exemple : OKR → Planning

```
1. Utilisateur crée KR "Méditer 100 fois en 2026"
2. Utilisateur lie ce KR à Routine "Méditation matinale"
   └── Crée core_entity_link (okr.key_result → planning.routine_template)
   
3. Chaque jour, utilisateur complète routine
   └── Trigger détecte le lien
   └── Incrémente lifeos_okr_key_results.current_value += 1
   └── Log dans lifeos_okr_progress_logs
   
4. Dashboard OKR affiche progression mise à jour
```

### Exemple : Journal → OKR

```
1. Utilisateur fait check-in hebdo sur son Objectif
2. Check-in crée entrée Journal automatique
   └── Crée core_entity_link (journal.entry → okr.objective)
   
3. Vue Objectif affiche les réflexions liées
```

---

## 7. Notes importantes

1. **Un "combat à résoudre" = un Objectif** (pas de table séparée)
2. **Les Domaines sont transverses** : utilisés par Planning ET OKR via `domain_id`
3. **Les Thèmes OKR peuvent mapper sur les Domaines** mais sont distincts
4. **Le Noyau Core arrive APRÈS** avoir 2 modules fonctionnels minimum
5. **Les Cycles OKR sont hiérarchiques** : Vision 10 ans → 3 ans → Annuel → Trimestriel → Mensuel
6. **Espaces = Dashboards personnalisés** par l'utilisateur avec widgets drag & drop
7. **Accueil = Today View intelligente** auto-générée, non configurable

---

## 8. Prochaines tâches (Décembre 2025)

### Immédiat (Cette semaine)

| # | Tâche | Temps | Priorité |
|---|-------|-------|----------|
| 1 | **Refonte Sidebar** : Nouvelle structure Accueil/Espaces/Modules | 1-2h | 🔴 Haute |
| 2 | **Migration OKR** : Créer toutes les tables SQL | 1h | 🔴 Haute |
| 3 | **UI OKR basique** : Formulaire création Objectif + KR | 2-3h | 🔴 Haute |
| 4 | **Seed 2026** : Créer cycle annuel + 4 trimestres | 30min | 🔴 Haute |

### Court terme (Semaine prochaine)

| # | Tâche | Temps | Priorité |
|---|-------|-------|----------|
| 5 | **Vue OKR complète** : Arbre Objectifs → KR → Initiatives | 3-4h | 🟡 Moyenne |
| 6 | **Check-ins** : Formulaire de review hebdo | 2h | 🟡 Moyenne |
| 7 | **Intégration KR ↔ Routine** : Lier et auto-tracker | 2-3h | 🟡 Moyenne |
| 8 | **Vue Accueil** : Today View auto-générée | 2h | 🟡 Moyenne |

### Moyen terme (Janvier 2026)

| # | Tâche | Temps | Priorité |
|---|-------|-------|----------|
| 9 | Tables et UI Espaces | 3-4h | 🟢 Basse |
| 10 | Système de Widgets | 4-5h | 🟢 Basse |
| 11 | Finaliser UI Projets | 2-3h | 🟢 Basse |
| 12 | Module Journal (début) | 4-6h | 🟢 Basse |

---

*Document à mettre à jour au fur et à mesure de l'implémentation.*

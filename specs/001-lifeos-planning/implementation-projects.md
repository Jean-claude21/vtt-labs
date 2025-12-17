# Plan d'Implémentation : Gestion de Projets Complète

**Feature**: 001-lifeos-planning  
**Date**: 2025-12-17  
**Status**: En cours  
**Estimé**: ~8 heures de développement

---

## 📋 Vue d'ensemble

Ce plan couvre l'implémentation complète de la gestion de projets, incluant les sous-tâches, pour atteindre un niveau de fonctionnalité production-ready.

---

## 🔍 Audit de l'existant

### ✅ Déjà implémenté

| Composant | Fichier | État |
|-----------|---------|------|
| Schéma BDD projets | `20251130120000_lifeos_planning.sql` | ✅ 100% |
| Schéma BDD sous-tâches | `parent_task_id` dans `lifeos_tasks` | ✅ 100% |
| Trigger auto-progression | `lifeos_update_task_progress()` | ✅ 100% |
| View Gantt | `lifeos_tasks_gantt` | ✅ 100% |
| Dépendances tâches | `lifeos_task_dependencies` | ✅ 100% |
| Actions CRUD projets | `projects.actions.ts` | ✅ 90% (manque update) |
| Liste projets | `/app/planning/projects` | ✅ 100% |
| Détail projet | `/app/planning/projects/[id]` | ✅ 85% |
| Kanban drag & drop | Kibo-UI intégré | ✅ 100% |
| Formulaire création | `project-form.tsx` | ✅ 100% |

### ❌ À implémenter

| Fonctionnalité | Priorité | Estimation |
|----------------|----------|------------|
| Édition projet | 🔴 Haute | 30 min |
| Création tâche depuis projet | 🔴 Haute | 1h |
| Sous-tâches (UI complète) | 🔴 Haute | 2h |
| Gantt interactif | 🟡 Moyenne | 2h |
| Dépendances UI | 🟡 Moyenne | 1.5h |
| Filtres avancés | 🟢 Basse | 45 min |

---

## 📦 Phase 1 : Édition de projet (30 min)

### 1.1 Route `/app/planning/projects/[id]/edit`

**Fichier**: `src/app/app/planning/projects/[id]/edit/page.tsx`

```tsx
// Server component qui charge le projet et affiche le formulaire
import { getProject } from '@/features/lifeos/actions/projects.actions';
import { getDomains } from '@/features/lifeos/actions/domains.actions';
import { EditProjectClient } from './edit-project-client';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [projectResult, domainsResult] = await Promise.all([
    getProject(id),
    getDomains(),
  ]);
  
  return (
    <EditProjectClient 
      project={projectResult.data}
      domains={domainsResult.data || []}
      error={projectResult.error}
    />
  );
}
```

### 1.2 Action `updateProject`

**Fichier**: `projects.actions.ts` - Vérifier si existe, sinon ajouter :

```typescript
export async function updateProject(input: unknown): Promise<ActionResult<Project>> {
  // Validation + update Supabase
}
```

### 1.3 Réutiliser `ProjectForm`

Le composant `project-form.tsx` supporte déjà le mode édition via la prop `project`.

---

## 📦 Phase 2 : Création de tâche depuis projet (1h)

### 2.1 Bouton "+ Ajouter tâche" dans détail projet

**Fichier**: `project-detail-dashboard.tsx`

Ajouter un bouton qui ouvre un dialog avec `TaskForm` pré-rempli avec `project_id`.

### 2.2 Composant `TaskFormDialog`

**Fichier**: `src/features/lifeos/components/tasks/task-form-dialog.tsx`

```tsx
interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;      // Pré-rempli si depuis un projet
  parentTaskId?: string;   // Pré-rempli si c'est une sous-tâche
  domains: Domain[];
  projects: Project[];
  onSuccess?: () => void;
}
```

### 2.3 Schéma de création de tâche

Vérifier que `createTaskSchema` accepte bien `project_id` et `parent_task_id`.

---

## 📦 Phase 3 : Gestion des sous-tâches (2h)

### 3.1 Action `getTaskWithSubtasks`

**Fichier**: `tasks.actions.ts`

```typescript
export async function getTaskWithSubtasks(taskId: string): Promise<ActionResult<TaskWithSubtasks>> {
  // Récupère la tâche + ses sous-tâches (WHERE parent_task_id = taskId)
}
```

### 3.2 Composant `SubtaskList`

**Fichier**: `src/features/lifeos/components/tasks/subtask-list.tsx`

```tsx
interface SubtaskListProps {
  parentTaskId: string;
  subtasks: Task[];
  onSubtaskToggle: (subtaskId: string, done: boolean) => void;
  onAddSubtask: () => void;
}

// UI: Liste dépliante avec:
// - Checkboxes pour marquer done
// - Bouton "+ Ajouter sous-tâche"
// - Indicateur de progression (3/5 terminées)
```

### 3.3 Composant `SubtaskItem`

**Fichier**: `src/features/lifeos/components/tasks/subtask-item.tsx`

```tsx
// - Checkbox
// - Titre éditable inline
// - Bouton supprimer
// - Drag handle pour réordonner
```

### 3.4 Création rapide de sous-tâche

**Fichier**: `src/features/lifeos/components/tasks/quick-subtask-input.tsx`

```tsx
// Input inline qui crée une sous-tâche au Enter
// Similaire à Todoist/Linear
```

### 3.5 Intégration dans `TaskCard`

Modifier `task-card.tsx` pour afficher :
- Indicateur "3/5 sous-tâches"
- Expansion pour voir les sous-tâches

### 3.6 Intégration dans détail de tâche

Créer ou modifier un composant de détail de tâche pour inclure `SubtaskList`.

---

## 📦 Phase 4 : Gantt interactif (2h)

### 4.1 Intégration Kibo-UI Gantt

**Fichier**: `src/components/kibo-ui/gantt/` 

Vérifier si le composant existe, sinon l'ajouter.

### 4.2 Composant `ProjectGantt`

**Fichier**: `src/features/lifeos/components/projects/project-gantt.tsx`

```tsx
interface ProjectGanttProps {
  tasks: GanttTask[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDependencyCreate?: (predecessor: string, successor: string) => void;
}

// Fonctionnalités:
// - Affichage barres temporelles
// - Drag pour modifier dates
// - Lignes de dépendance
// - Zoom jour/semaine/mois
// - Mise en évidence chemin critique
```

### 4.3 Mapper les données

Utiliser la view `lifeos_tasks_gantt` qui contient déjà :
- `predecessor_ids`
- `successor_ids`
- `subtask_count`
- `subtasks_done`

---

## 📦 Phase 5 : Dépendances de tâches UI (1.5h)

### 5.1 Composant `DependencySelector`

**Fichier**: `src/features/lifeos/components/tasks/dependency-selector.tsx`

```tsx
interface DependencySelectorProps {
  taskId: string;
  projectId: string;
  currentDependencies: string[];
  availableTasks: Task[];
  onAdd: (predecessorId: string) => void;
  onRemove: (predecessorId: string) => void;
}

// UI: Combobox multi-select avec:
// - Recherche des tâches du projet
// - Affichage des dépendances actuelles
// - Boutons pour ajouter/retirer
```

### 5.2 Validation cycles

Implémenter côté action la détection de cycles de dépendances (A → B → C → A).

### 5.3 Affichage dans liste/kanban

Badge "⚠️ Bloquée par X" si une tâche a des prédécesseurs non terminés.

---

## 📦 Phase 6 : Filtres avancés (45 min)

### 6.1 Composant `ProjectFilters`

**Fichier**: `src/features/lifeos/components/projects/project-filters.tsx`

```tsx
// Filtres disponibles:
// - Par domaine
// - Par statut (actif, en pause, terminé, archivé)
// - Par date cible (cette semaine, ce mois, en retard)
// - Recherche textuelle
```

### 6.2 Composant `TaskFiltersToolbar`

**Fichier**: `src/features/lifeos/components/tasks/task-filters-toolbar.tsx`

```tsx
// Pour le détail projet:
// - Par statut
// - Par priorité
// - Par assignation de date
// - Avec/sans sous-tâches
```

---

## 🗂️ Structure de fichiers finale

```
src/features/lifeos/
├── actions/
│   ├── projects.actions.ts    # ✏️ Ajouter updateProject
│   └── tasks.actions.ts       # ✏️ Ajouter getTaskWithSubtasks
├── components/
│   ├── projects/
│   │   ├── project-form.tsx         # ✅ Existe
│   │   ├── project-gantt.tsx        # 🆕 Nouveau
│   │   └── project-filters.tsx      # 🆕 Nouveau
│   └── tasks/
│       ├── task-card.tsx            # ✏️ Ajouter sous-tâches
│       ├── task-form.tsx            # ✅ Existe
│       ├── task-form-dialog.tsx     # 🆕 Nouveau
│       ├── subtask-list.tsx         # 🆕 Nouveau
│       ├── subtask-item.tsx         # 🆕 Nouveau
│       ├── quick-subtask-input.tsx  # 🆕 Nouveau
│       └── dependency-selector.tsx  # 🆕 Nouveau
└── schema/
    └── tasks.schema.ts              # ✏️ Ajouter TaskWithSubtasks

src/app/app/planning/projects/
├── page.tsx                         # ✅ Existe
├── projects-dashboard.tsx           # ✅ Existe
└── [id]/
    ├── page.tsx                     # ✅ Existe
    ├── project-detail-dashboard.tsx # ✏️ Ajouter bouton tâche
    └── edit/
        ├── page.tsx                 # 🆕 Nouveau
        └── edit-project-client.tsx  # 🆕 Nouveau
```

---

## ✅ Checklist d'implémentation

### Phase 1 : Édition projet
- [ ] Créer route `/app/planning/projects/[id]/edit/page.tsx`
- [ ] Créer `edit-project-client.tsx`
- [ ] Vérifier/ajouter action `updateProject`
- [ ] Tester édition complète

### Phase 2 : Création tâche depuis projet
- [ ] Créer `task-form-dialog.tsx`
- [ ] Ajouter bouton dans `project-detail-dashboard.tsx`
- [ ] Vérifier schéma `createTaskSchema`
- [ ] Tester création avec project_id pré-rempli

### Phase 3 : Sous-tâches
- [ ] Ajouter action `getTaskWithSubtasks`
- [ ] Créer `subtask-list.tsx`
- [ ] Créer `subtask-item.tsx`
- [ ] Créer `quick-subtask-input.tsx`
- [ ] Modifier `task-card.tsx` pour afficher indicateur
- [ ] Tester création/toggle/suppression sous-tâches

### Phase 4 : Gantt
- [ ] Vérifier Kibo-UI Gantt
- [ ] Créer `project-gantt.tsx`
- [ ] Intégrer dans onglet Gantt du projet
- [ ] Tester drag & drop dates

### Phase 5 : Dépendances UI
- [ ] Créer `dependency-selector.tsx`
- [ ] Ajouter dans formulaire de tâche
- [ ] Afficher badge "bloquée par" dans liste
- [ ] Tester création/suppression dépendances

### Phase 6 : Filtres
- [ ] Créer `project-filters.tsx`
- [ ] Créer `task-filters-toolbar.tsx`
- [ ] Intégrer dans dashboards
- [ ] Tester combinaisons de filtres

---

## 📈 Progression attendue

| Phase | Après complétion |
|-------|------------------|
| État actuel | 75% |
| Phase 1 (Édition) | 80% |
| Phase 2 (Création tâche) | 85% |
| Phase 3 (Sous-tâches) | 92% |
| Phase 4 (Gantt) | 96% |
| Phase 5 (Dépendances) | 98% |
| Phase 6 (Filtres) | 100% |

---

## 🎯 MVP vs Full

### MVP (Phases 1-3) → 92%
Suffisant pour une utilisation quotidienne efficace :
- CRUD complet projets
- CRUD tâches depuis projet
- Sous-tâches avec progression auto
- Kanban fonctionnel

### Full (Phases 4-6) → 100%
Expérience complète type Linear/Asana :
- Gantt interactif
- Dépendances visuelles
- Filtres avancés

---

## 🚀 Ordre de priorité recommandé

1. **Phase 1** - 30 min - Débloquer l'édition
2. **Phase 2** - 1h - Flux de création fluide
3. **Phase 3** - 2h - Sous-tâches (valeur maximale)
4. **Phase 5** - 1.5h - Dépendances (avant Gantt pour data)
5. **Phase 4** - 2h - Gantt (visualisation finale)
6. **Phase 6** - 45 min - Polish

**Total estimé** : ~8 heures pour 100%

# Contexte de Session - LifeOS Planning Module

**Date de dernière mise à jour**: 17 décembre 2025  
**Branche Git**: `001-lifeos-planning`

---

## 🎯 Objectif Utilisateur

> "Je compte à partir de demain planifier mon année 2026 à venir sur tous les aspects de ma vie, caractère, consécration, service. Je préfère un module OKR très complet."

**Ordre de priorité établi**:
1. ✅ Finaliser le module **Planning** (ex-LifeOS)
2. 🔜 Implémenter le module **OKR** complet
3. ⏳ Modules futurs: Journal, Finance

---

## 📁 Architecture Technique

### Stack
- **Next.js**: 15.4.10 (App Router)
- **React**: 19.x avec TypeScript strict
- **Supabase**: PostgreSQL avec RLS
- **UI**: Shadcn/ui + Kibo-UI (Kanban, Gantt installés)
- **Design**: Linear-inspired, Red Signature, dark mode par défaut

### Structure des Routes (renommées)
```
/app/planning/           → Dashboard calendrier (ex /app/lifeos)
/app/planning/tasks      → Gestion des tâches
/app/planning/routines   → Gestion des routines
/app/planning/projects   → Liste des projets avec progression
/app/planning/projects/[id] → Détail projet (4 vues)
/app/planning/settings   → Paramètres domaines
/app/planning/stats      → Statistiques
```

### Sidebar Refactorée
```
├── 🏠 Accueil (Today View - placeholder)
├── ─── MODULES ───
│   ├── 📅 Planning ▶ (collapsible: Calendrier, Tâches, Routines, Projets, Stats)
│   └── 🎯 OKR ▶ (Bientôt disponible - grayed out)
├── ─── SYSTÈME ───
│   ├── 🎨 Domaines → /app/planning/settings
│   └── ⚙️ Paramètres → /app/user-settings
└── 👤 User footer
```

---

## ✅ Fonctionnalités Complétées

### Module Planning (Core)
- [x] Calendrier avec vue jour/semaine/mois
- [x] Tâches avec statuts, priorités, domaines
- [x] Routines avec récurrence et checklists
- [x] Statistiques de productivité
- [x] Domaines de vie configurables

### Projets (Juste terminé)
- [x] Liste des projets avec progression réelle (%)
- [x] Vue Cartes + Vue Gantt globale
- [x] **Page détail projet** `/app/planning/projects/[id]`
  - 4 vues: Kanban, Liste, Gantt (placeholder), Timeline
  - Kanban avec drag & drop (changement de statut)
  - Header avec progression et actions
  - Modal de suppression avec confirmation
- [x] **Formulaire création projet** (Modal)
  - Nom, description, domaine, couleur
  - Dates début/fin avec calendrier
  - Validation Zod
- [x] Schéma `Project` mis à jour avec `color`
- [x] Action `createProject` avec support couleur
- [x] Action `getProjectsWithProgress` pour liste avec métriques

---

## 🔄 En Cours / À Faire

### Projets (Prochaines étapes)
1. **Appliquer la migration** `20251216000000_projects_enhancement.sql`
   - Ajoute `lifeos_task_dependencies` (predecesseur/successeur)
   - Ajoute `lifeos_tasks.start_date`
   - Ajoute `lifeos_projects.color`
   - Crée les vues `lifeos_projects_with_progress` et `lifeos_tasks_gantt`

2. **Formulaire d'édition projet** (pas encore fait)
   - Réutiliser `ProjectForm` avec projet existant
   - Ajouter bouton édition dans page détail

3. **Ajouter des tâches au projet**
   - Bouton "+ Ajouter tâche" dans page détail
   - Lier une tâche existante au projet

4. **Intégration Kibo-UI Gantt complète**
   - Remplacer le placeholder par le vrai composant
   - Afficher les dépendances entre tâches

5. **Ajouter `start_date` au schéma Task**
   - Pour le Gantt avec dates début/fin

---

## 📂 Fichiers Clés Modifiés

### Actions Serveur
```
src/features/lifeos/actions/projects.actions.ts
  - getProjectsWithProgress() → liste avec métriques
  - getProjectTasks() → tâches d'un projet
  - createProject() → avec support color
```

### Composants
```
src/app/app/planning/projects/
  - page.tsx → route liste projets
  - projects-dashboard.tsx → dashboard avec formulaire modal

src/app/app/planning/projects/[id]/
  - page.tsx → route détail projet
  - project-detail-dashboard.tsx → 4 vues (Kanban, Liste, Gantt, Timeline)

src/features/lifeos/components/projects/
  - project-form.tsx → formulaire modal création/édition

src/components/app-sidebar.tsx → sidebar refactorée
```

### Schémas
```
src/features/lifeos/schema/projects.schema.ts
  - projectSchema → ajout color
  - projectWithMetricsSchema → ajout in_progress_tasks
```

### Migrations
```
supabase/migrations/20251216000000_projects_enhancement.sql
  - À APPLIQUER avec `supabase db reset` ou `supabase migration up`
```

---

## 🏗️ Architecture Modules (spec document)

Voir `specs/002-architecture-modules/architecture.md` pour:
- Vision complète des modules (Planning, OKR, Journal, Finance)
- Système d'Espaces avec widgets personnalisables
- Noyau Core pour liens entre entités
- Roadmap d'implémentation

---

## 💡 Décisions Techniques Importantes

1. **Routes renommées**: `/app/lifeos` → `/app/planning`
2. **Navigation**: Sidebar globale, plus de lifeos-nav.tsx séparé
3. **Type safety**: Assertions de type pour requêtes Supabase (types pas régénérés)
4. **Kibo-UI**: Kanban fonctionnel, Gantt en placeholder
5. **Couleurs projet**: Support hex avec palette prédéfinie

---

## 🚀 Pour Continuer

### Commande pour appliquer la migration:
```bash
cd vtt-labs
supabase db reset  # Réinitialise avec toutes les migrations
# OU
supabase migration up  # Applique seulement les nouvelles
```

### Prochaine tâche suggérée:
1. Appliquer migration `20251216000000_projects_enhancement.sql`
2. Tester création de projet dans l'UI
3. Implémenter édition de projet
4. Commencer module OKR

### Build vérifié:
```bash
pnpm build  # ✅ Passe (seulement warnings)
```

---

## 📋 Modules OKR - Notes Préliminaires

Structure envisagée (à implémenter):
```
OKR Cycles → Objectives → Key Results → Milestones
                                      → Initiatives (liens vers Tasks/Routines)
```

Tables à créer:
- `okr_cycles` (Q1 2026, Annual 2026, etc.)
- `okr_objectives` (qualitatif)
- `okr_key_results` (quantitatif, métriques)
- `okr_milestones` (jalons intermédiaires)
- `okr_kr_initiatives` (liens vers tasks/routines)

Voir section OKR dans `architecture.md` pour le détail complet.

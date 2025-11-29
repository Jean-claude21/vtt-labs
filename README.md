# 🔴 VTT Labs

> **Un laboratoire personnel d'applications modulaires** — Construire, expérimenter, évoluer.

VTT Labs est une plateforme multi-applications conçue pour centraliser tous mes outils de productivité personnelle. Chaque module est une application autonome qui peut être activée ou désactivée par utilisateur.

**Design System** : Linear-inspired + Red Signature 🔴

---

## 🎯 Vision

Créer un **système d'exploitation personnel** où chaque aspect de ma vie (objectifs, finances, routines, IA) est géré par un module dédié, interconnecté mais indépendant.

---

## 📦 Modules

VTT Labs est conçu pour accueillir un **nombre illimité de modules**. Chaque idée peut devenir une app.

### Modules Actuels

| Module | Description | Statut |
|--------|-------------|--------|
| **🎯 OKR & Routines** | Gestion d'objectifs, routines quotidiennes, planification intelligente | 🚧 En cours |

### Modules Planifiés (exemples)

| Module | Description |
|--------|-------------|
| **💰 Finance** | Budget, dépenses, objectifs d'épargne, analyses |
| **🤖 Agents IA** | Création et gestion d'agents IA personnalisés |
| **💬 Chat** | Messagerie style WhatsApp avec intégration IA |
| **📊 Dashboard** | Vue d'ensemble et statistiques cross-modules |
| **📝 Notes** | Prise de notes style Notion/Obsidian |
| **📚 Learning** | Suivi d'apprentissage, flashcards, progression |
| **🏋️ Health** | Suivi fitness, nutrition, habitudes |
| **📅 Calendar** | Agenda intelligent avec sync externe |
| **🔗 Integrations** | Connexions API tierces (Google, Notion, etc.) |
| **...** | *Et tout ce qui vous passe par la tête* |

> 💡 **Philosophie** : Chaque nouvelle idée = un nouveau module. Pas de limites.

---

## 🏗️ Architecture

### Stack Technique

| Couche | Technologie | Version |
|--------|-------------|--------|
| **Framework** | Next.js (App Router) | 15.x |
| **Runtime** | React | 19.x |
| **Language** | TypeScript (strict) | 5.x |
| **Base de données** | Supabase Postgres + Auth | Latest |
| **UI** | Shadcn UI + TailwindCSS | Latest |
| **Validation** | Zod | 3.x |
| **Styling** | Linear-style + Red Signature | - |
| **Server Logic** | Server Actions uniquement | - |

### Structure du Projet

```
vtt-labs/
├── src/
│   ├── app/                      # Routing Next.js
│   │   ├── (marketing)/          # Landing, legal...
│   │   ├── (auth)/               # Authentification
│   │   └── (dashboard)/          # Applications du lab
│   │       ├── okr/              # Module OKR
│   │       ├── finance/          # Module Finance
│   │       ├── agents/           # Module Agents IA
│   │       └── chat/             # Module Chat
│   │
│   ├── features/                 # Logique métier isolée
│   │   ├── okr/
│   │   │   ├── components/       # Composants React
│   │   │   ├── actions/          # Server Actions
│   │   │   ├── services/         # Business logic
│   │   │   └── schema/           # Validation Zod
│   │   ├── finance/
│   │   ├── agents/
│   │   └── chat/
│   │
│   ├── components/
│   │   ├── ui/                   # Shadcn (partagé)
│   │   └── shared/               # Composants cross-app
│   │
│   └── lib/
│       ├── supabase/             # Client + helpers
│       └── utils/                # Utilitaires partagés
│
└── supabase/
    └── migrations/               # Schéma DB versionné
```

### Modèle de Données

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTI-USER + PARTAGE                     │
├─────────────────────────────────────────────────────────────┤
│  • Données privées par défaut (user_id + RLS)              │
│  • Partage sélectif entre utilisateurs                      │
│  • Feature flags par utilisateur (admin-controlled)         │
│  • Permissions : view | edit | admin                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- pnpm
- Compte Supabase

### Installation

```bash
# Cloner le repo
git clone https://github.com/Jean-claude21/vtt-labs.git
cd vtt-labs

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# Lancer le serveur de développement
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### Commandes Utiles

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm lint         # Linting ESLint
pnpm db:push      # Push migrations Supabase
pnpm db:generate  # Générer types TypeScript
```

---

## 📐 Principes de Développement

Ce projet suit la méthodologie **Spec-Driven Development (SDD)** :

1. **Constitution** → Règles non-négociables du projet
2. **Specification** → Quoi construire et pourquoi
3. **Plan** → Comment le construire techniquement
4. **Tasks** → Étapes atomiques d'implémentation
5. **Implement** → Code validé à chaque étape

Les artefacts SDD sont dans `.specify/`.

### Règles Clés

- ✅ **Server Actions uniquement** — API Routes interdites
- ✅ **Feature-based architecture** — Modules isolés dans `features/`
- ✅ **RLS obligatoire** — Toutes les tables avec `user_id`
- ✅ **Zod partout** — Validation sur toutes les entrées
- ✅ **TypeScript strict** — `any` interdit
- ✅ **Red Signature** — Design system Linear + Rouge
- ✅ **Dark mode** — Par défaut, light disponible

---

## 🎨 Design System — Red Signature

### Principes

| Aspect | Choix |
|--------|-------|
| **Mode** | Dark par défaut (`zinc-950`) |
| **Accent Principal** | 🔴 Rouge (`red-500` / `#EF4444`) |
| **Palette** | Zinc (fond) + Rouge (accent) + Couleurs modules |
| **Typographie** | Inter (UI), Geist Mono (code) |
| **Densité** | Haute (Linear-style) |
| **Radius** | Petit (`rounded-md`, 6px) |
| **Navigation** | Sidebar + Command Palette (⌘K) |
| **Feedback** | Toasts + Skeleton loaders |

### Couleurs

```
Background:   #09090B (zinc-950)
Cards:        #18181B (zinc-900)
Borders:      #27272A (zinc-800)
Accent:       #EF4444 (red-500) 🔴
Text:         #FAFAFA (zinc-50)
```

### Couleurs par Module

| Module | Slug | Couleur | Code |
|--------|------|---------|------|
| Core | `core` | 🔴 Rouge | `red-500` |
| OKR | `okr` | 🟠 Orange | `orange-500` |
| Finance | `finance` | 🟢 Emeraude | `emerald-500` |
| Agents IA | `ai-agents` | 🟣 Violet | `violet-500` |
| Chat | `chat` | 🟡 Ambre | `amber-500` |
| Health | `health` | 🩷 Rose | `pink-500` |
| Notes | `notes` | 🔵 Indigo | `indigo-500` |
| Learning | `learning` | 🩵 Cyan | `cyan-500` |

### Feedback Utilisateur

| Type | Couleur | Note |
|------|---------|------|
| Success | `emerald-500` | ✅ |
| Error | `orange-500` | ⚠️ Pas rouge (évite confusion avec accent) |
| Warning | `amber-500` | ⚠️ |
| Info | `blue-500` | ℹ️ |

---

## 🔐 Modèle d'Accès

### Rôles

| Rôle | Permissions |
|------|-------------|
| **Admin** | Accès complet + gestion des feature flags |
| **User** | Accès aux modules autorisés uniquement |

### Partage de Données

Les utilisateurs peuvent partager des ressources spécifiques :

```
User A ──[partage agenda en lecture]──→ User B
User B ──[partage agenda en édition]──→ User A
```

---

## 📊 Roadmap

### Phase 1 : Fondations ✅
- [x] Setup Next.js 15 + Supabase
- [x] Authentification
- [x] Design system de base
- [x] Structure feature-based

### Phase 2 : Premier Module (OKR) 🚧
- [ ] Domaines de vie
- [ ] Routines récurrentes
- [ ] Tâches one-off
- [ ] Générateur de planning
- [ ] Tracking d'exécution
- [ ] Statistiques

### Phase 3+ : Expansion Continue 📋
- [ ] Nouveaux modules selon les idées
- [ ] Système de partage entre users
- [ ] Admin panel pour feature flags
- [ ] Intégrations externes
- [ ] Mobile (PWA ou React Native)
- [ ] Et plus encore...

> 🔄 **Ce lab évolue en continu** — La roadmap n'est jamais figée.

---

## 📄 Licence

Projet personnel — Tous droits réservés.

---

## 👤 Auteur

**Jean-Claude** — [@Jean-claude21](https://github.com/Jean-claude21)

---

<p align="center">
  🔴 <i>Construire les outils qu'on mérite.</i> 🔴
</p>

# LifeOS - Document Conceptuel

> **Version**: 1.0.0  
> **Date**: 2025-11-30  
> **Auteur**: VTT Labs Team  
> **Statut**: Draft - En cours de validation

---

## 📖 Table des Matières

1. [Vision & Philosophie](#1-vision--philosophie)
2. [Problèmes Résolus](#2-problèmes-résolus)
3. [Concepts Fondamentaux](#3-concepts-fondamentaux)
4. [Architecture Modulaire](#4-architecture-modulaire)
5. [Modèle de Données](#5-modèle-de-données)
6. [Flux Utilisateur](#6-flux-utilisateur)
7. [Intelligence Artificielle](#7-intelligence-artificielle)
8. [Métriques & Analytics](#8-métriques--analytics)
9. [Intégrations](#9-intégrations)
10. [Roadmap](#10-roadmap)
11. [Modules Additionnels](#11-modules-additionnels)

---

## 1. Vision & Philosophie

### 1.1 Qu'est-ce que LifeOS ?

**LifeOS** est un système d'exploitation personnel — une couche applicative au sein de VTT Labs qui permet de **planifier, exécuter, mesurer et optimiser** tous les aspects de sa vie de manière intentionnelle.

> *"La vie ne s'improvise pas. Elle se design."*

### 1.2 Philosophie Centrale

LifeOS repose sur 3 piliers fondamentaux :

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🎯 INTENTION          🔄 EXÉCUTION         📊 RÉFLEXION   │
│                                                             │
│   Définir ce qui       Transformer les      Analyser pour  │
│   compte vraiment      intentions en        comprendre et  │
│   pour toi             actions concrètes    progresser     │
│                                                             │
│   • Domaines de vie    • Routines           • Métriques    │
│   • Objectifs (OKR)    • Tâches             • Patterns     │
│   • Projets            • Planning IA        • Insights     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Principes Directeurs

| Principe | Description |
|----------|-------------|
| **Holistique** | Couvre TOUS les domaines de vie, pas juste le travail |
| **Intentionnel** | Chaque action est alignée avec une vision plus grande |
| **Intelligent** | L'IA assiste, suggère et optimise — sans imposer |
| **Honnête** | Les données révèlent la réalité, pas l'illusion |
| **Adaptatif** | Le système apprend de toi et s'ajuste |
| **Actionnable** | Chaque insight mène à une action concrète |

---

## 2. Problèmes Résolus

### 2.1 Les Douleurs Quotidiennes

| Problème | Impact | Solution LifeOS |
|----------|--------|-----------------|
| **Surcharge mentale** | "J'ai trop de choses à penser, je ne sais pas par où commencer" | L'IA génère ton planning, tu exécutes |
| **Intentions vs Réalité** | "Je veux faire du sport mais je n'y arrive jamais" | Tracking honnête + patterns + suggestions |
| **Fragmentation** | "Mes tâches sont dans 10 apps différentes" | Une source de vérité unique |
| **Manque de vision** | "Je suis occupé mais j'avance vers quoi ?" | Alignement Domaines → Objectifs → Actions |
| **Discipline inconsistante** | "Je tiens 2 semaines puis j'abandonne" | Streaks, accountability, friction réduite |
| **Mauvaise allocation temps** | "Je passe trop de temps sur X, pas assez sur Y" | Budget temps par domaine + analyse |

### 2.2 Ce que LifeOS N'est PAS

- ❌ Un simple todo-list (c'est bien plus profond)
- ❌ Un calendrier classique (il génère intelligemment)
- ❌ Un tracker d'habitudes basique (il comprend le contexte)
- ❌ Un système rigide (il s'adapte à toi)
- ❌ Une prison de productivité (il respecte ton humanité)

---

## 3. Concepts Fondamentaux

### 3.1 Les Domaines de Vie

Les **Domaines** sont les grandes catégories qui structurent ta vie. Chaque élément de LifeOS (routine, tâche, projet, dépense, note...) est rattaché à un domaine.

#### Domaines par Défaut (Personnalisables)

| Domaine | Icône | Couleur | Vision |
|---------|-------|---------|--------|
| **Spiritualité & Foi** | 🙏 | Bleu profond | Grandir dans ma relation avec Dieu et impacter mon entourage |
| **Finances & Patrimoine** | 💰 | Vert | Liberté financière et générosité pour impacter le Royaume |
| **Carrière & Business** | 🚀 | Orange | Devenir expert reconnu et créer de la valeur significative |
| **Relations & Famille** | ❤️ | Rose | Relations profondes et famille épanouie |
| **Santé & Bien-être** | 💪 | Rouge | Corps fort, esprit sain, énergie optimale |
| **Développement Personnel** | 🧠 | Violet | Croissance continue et maîtrise de soi |
| **Environnement & Lifestyle** | 🏠 | Marron | Environnement harmonieux et style de vie équilibré |
| **Contribution & Impact** | 🎯 | Jaune | Laisser un héritage positif et servir une cause plus grande |

#### Budget Temps par Domaine

Tu peux définir combien de temps tu veux accorder à chaque domaine :

```
Exemple de budget journalier :
├── Spiritualité & Foi      : 1h30  (méditation, prière, lecture)
├── Carrière & Business     : 6h00  (deep work, meetings, admin)
├── Santé & Bien-être       : 1h30  (sport, repas conscients)
├── Relations & Famille     : 2h00  (qualité time)
├── Développement Personnel : 1h00  (lecture, apprentissage)
└── Autres                  : 4h00  (sommeil non compté)
```

LifeOS trackera automatiquement ton allocation réelle vs souhaitée.

---

### 3.2 Les Routines

Une **Routine** est une action récurrente que tu veux ancrer dans ta vie. C'est le cœur battant de LifeOS.

#### Structure d'une Routine

```
ROUTINE TEMPLATE (Le modèle)
│
├── Identité
│   ├── Nom : "Pompes matinales"
│   ├── Domaine : Santé & Bien-être
│   ├── Catégorie Moment : Matin
│   ├── Catégorie Type : Santé
│   └── Tags : ["sport", "force", "discipline"]
│
├── Contraintes (flexibles ou strictes)
│   ├── Durée : 15 minutes (requis: oui)
│   ├── Créneau : 07:00 - 07:15 (requis: oui)
│   ├── Valeur cible : 300 pompes (requis: non)
│   └── Unité : pompes
│
├── Récurrence
│   ├── Type : Hebdomadaire
│   ├── Jours : Lun, Mar, Mer, Jeu, Ven
│   └── Exceptions : jours fériés
│
└── Options
    ├── Flexibilité : Non (horaire fixe)
    ├── Priorité : Haute
    └── Projet par défaut : null
```

#### Types de Récurrence Supportés

| Type | Exemple |
|------|---------|
| **Quotidien** | Tous les jours |
| **Jours spécifiques** | Lun, Mer, Ven |
| **Intervalle** | Tous les 3 jours |
| **Hebdomadaire** | Chaque semaine le lundi |
| **Mensuel** | Le 1er et 15 de chaque mois |
| **Personnalisé** | Règle RRULE complexe |

#### Catégorisation des Routines

**Par Moment (Quand)**
- 🌅 Matin (05:00 - 11:59)
- ☀️ Midi (12:00 - 13:59)
- 🌆 Après-midi (14:00 - 17:59)
- 🌙 Soir (18:00 - 21:59)
- 🌚 Nuit (22:00 - 04:59)

**Par Type (Nature)**
- 💼 Professionnelle
- 🏠 Personnelle
- 🙏 Spirituelle
- 💪 Santé
- 📚 Apprentissage
- 🎮 Loisir
- ⚡ Énergie (pauses, récupération)

#### Instance de Routine (L'exécution)

Chaque occurrence génère une **Instance** :

```
ROUTINE INSTANCE (Ce qui s'est passé)
│
├── Planifié
│   ├── Date : 2025-12-02
│   ├── Heure début : 07:00
│   └── Heure fin : 07:15
│
├── Réalisé
│   ├── Heure début réelle : 07:05
│   ├── Heure fin réelle : 07:22
│   ├── Valeur atteinte : 280 pompes
│   └── Statut : Partiel
│
├── Score de complétion : 85%
│   ├── Durée respectée : ❌ (17min vs 15min)
│   ├── Créneau respecté : ⚠️ (5min retard)
│   └── Valeur atteinte : ⚠️ (280/300 = 93%)
│
├── Contexte
│   ├── Humeur avant : 😐 Neutre
│   ├── Humeur après : 😊 Bien
│   ├── Énergie : 7/10
│   └── Notes : "Fatigue musculaire, récupération insuffisante"
│
└── Tâches liées : [] (aucune pour cette routine)
```

---

### 3.3 Les Tâches

Une **Tâche** est une action ponctuelle à réaliser, avec ou sans deadline.

#### Structure d'une Tâche

```
TASK
│
├── Identité
│   ├── Titre : "Implémenter le module Routines"
│   ├── Description : "Créer le CRUD complet..."
│   ├── Domaine : Carrière & Business
│   ├── Projet : VTT Labs
│   └── Tags : ["dev", "backend", "priority"]
│
├── Planification
│   ├── Date d'échéance : 2025-12-10
│   ├── Heure d'échéance : null (flexible dans la journée)
│   ├── Deadline stricte : Non
│   ├── Durée estimée : 4h
│   └── Priorité : Haute
│
├── Statut
│   ├── État : In Progress
│   ├── Progression : 60%
│   └── Durée réelle : 2h30 (en cours)
│
├── Hiérarchie
│   ├── Tâche parente : "Module LifeOS Foundations"
│   └── Sous-tâches : [...]
│
└── Historique
    └── Changements de statut avec timestamps
```

#### États d'une Tâche

```
BACKLOG → TODO → IN_PROGRESS → BLOCKED → DONE
                      ↓                    ↓
                  CANCELLED            ARCHIVED
```

#### Lien Routine ↔ Tâche

Cas d'usage : **"Routine de code 8h-12h, mais sur quel projet ?"**

```
RoutineInstance: "Deep Work - Code" (Lundi 8h-12h)
│
└── Tâches travaillées pendant cette routine :
    ├── Task: "Fix bug auth" (Projet: Client X) → 45min
    ├── Task: "Module Routines" (Projet: VTT Labs) → 2h30
    └── Task: "Code review" (Projet: VTT Labs) → 45min
    
    Total : 4h → Routine complétée ✅
```

Cela permet de :
- ✅ Valider que la routine est faite
- ✅ Savoir précisément ce qui a été accompli
- ✅ Attribuer le temps aux bons projets
- ✅ Analyser la répartition du temps de travail

---

### 3.4 Les Projets

Un **Projet** est un conteneur regroupant des tâches vers un objectif commun.

```
PROJECT
│
├── Identité
│   ├── Nom : "VTT Labs"
│   ├── Domaine : Carrière & Business
│   ├── Description : "Plateforme modulaire..."
│   └── Couleur : #3B82F6
│
├── Temporalité
│   ├── Date début : 2025-11-01
│   ├── Date cible : 2026-03-01
│   └── Statut : Actif
│
├── Contenu
│   ├── Tâches : 47 (12 done, 8 in progress, 27 todo)
│   └── Temps investi : 156h
│
└── Métriques
    ├── Progression : 25%
    ├── Vélocité : 12h/semaine
    └── Estimation fin : 2026-02-15
```

---

### 3.5 Les Événements (Contraintes)

Les **Événements** sont des blocs de temps fixes qui contraignent le planning.

```
EVENT
│
├── Titre : "Réunion client X"
├── Domaine : Carrière & Business
├── Date/Heure : 2025-12-02 14:00 - 15:30
├── Récurrence : Chaque lundi
├── Source : Google Calendar (sync)
├── Bloquant : Oui (ne pas planifier autre chose)
└── Externe ID : "gcal_abc123"
```

---

### 3.6 Le Planning Intelligent

Le **Planning** est généré par l'IA en combinant :
- Tes routines (ce que tu veux faire)
- Tes tâches (ce que tu dois faire)
- Tes événements (ce qui est déjà prévu)
- Tes contraintes (budget temps, préférences)
- Ton historique (ce qui marche pour toi)

#### Processus de Génération

```
                    ┌─────────────────────┐
                    │   INPUTS            │
                    ├─────────────────────┤
                    │ • Routines du jour  │
                    │ • Tâches à placer   │
                    │ • Événements fixes  │
                    │ • Préférences user  │
                    │ • Historique        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   🤖 AI SCHEDULER   │
                    ├─────────────────────┤
                    │ 1. Place les fixes  │
                    │ 2. Place routines   │
                    │ 3. Optimise tâches  │
                    │ 4. Ajoute buffers   │
                    │ 5. Vérifie conflits │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   OUTPUT            │
                    ├─────────────────────┤
                    │ Planning optimisé   │
                    │ avec raisonnement   │
                    │ pour chaque slot    │
                    └─────────────────────┘
```

#### Structure du Planning

```
GENERATED PLAN (Journée du 2025-12-02)
│
├── Métadonnées
│   ├── Date : 2025-12-02
│   ├── Statut : Actif
│   ├── Généré le : 2025-12-01 22:00
│   └── Score optimisation : 94%
│
└── Slots
    │
    ├── 05:30 - 06:00 │ ROUTINE │ Méditation matinale
    │                 │ Raison IA : "Tu es plus concentré tôt le matin"
    │
    ├── 06:00 - 06:30 │ ROUTINE │ Lecture Bible
    │                 │ Raison IA : "Habitude ancrée, 45 jours streak"
    │
    ├── 06:30 - 07:00 │ ROUTINE │ Sport - Pompes
    │                 │ Raison IA : "Créneau fixe non négociable"
    │
    ├── 07:00 - 07:30 │ BUFFER  │ Préparation & petit-déj
    │
    ├── 08:00 - 12:00 │ ROUTINE │ Deep Work - Code
    │                 │ Tâches suggérées :
    │                 │ - "Module Routines" (priorité haute, 3h)
    │                 │ - "Fix bug auth" (deadline proche, 1h)
    │                 │ Raison IA : "Tu es à 80% de ton objectif hebdo VTT Labs"
    │
    ├── 12:00 - 13:00 │ BREAK   │ Déjeuner
    │
    ├── 13:00 - 13:30 │ ROUTINE │ Marche digestive
    │                 │ Raison IA : "Améliore ta concentration PM de 23%"
    │
    ├── 14:00 - 15:30 │ EVENT   │ Réunion client X (Google Cal)
    │                 │ ⚠️ Bloquant - Non déplaçable
    │
    ├── 15:30 - 17:30 │ TASK    │ "Préparer présentation Q1"
    │                 │ Raison IA : "Deadline dans 3 jours, 2h estimées"
    │
    ├── 17:30 - 18:00 │ BUFFER  │ Admin & emails
    │
    ├── 18:00 - 19:00 │ ROUTINE │ Temps famille
    │                 │ Raison IA : "Budget Relations à 70% cette semaine"
    │
    ├── 19:00 - 20:00 │ BREAK   │ Dîner
    │
    ├── 20:00 - 21:00 │ ROUTINE │ Lecture personnelle
    │                 │ Raison IA : "Objectif 30 livres/an, en avance"
    │
    └── 21:00 - 21:30 │ ROUTINE │ Review journée & prépa lendemain
```

---

## 4. Architecture Modulaire

### 4.1 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        VTT LABS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              🏛️ FONDATION GÉNÉRIQUE                       │ │
│  │                                                           │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │ Auth    │ │ Users   │ │ Modules │ │ Admin   │         │ │
│  │  │ ✅ FAIT │ │ ✅ FAIT │ │ ✅ FAIT │ │ ✅ FAIT │         │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              🧬 LIFEOS FOUNDATION                         │ │
│  │                                                           │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │ Domains │ │ Tags    │ │ Metrics │ │ AI      │         │ │
│  │  │         │ │ System  │ │ Engine  │ │ Engine  │         │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  │                                                           │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                     │ │
│  │  │ Calendar│ │ Mood &  │ │ Sync    │                     │ │
│  │  │ Engine  │ │ Energy  │ │ Engine  │                     │ │
│  │  └─────────┘ └─────────┘ └─────────┘                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              📦 LIFEOS MODULES                            │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐│ │
│  │  │ PLANNING CORE (V1)                                   ││ │
│  │  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     ││ │
│  │  │ │Routines │ │ Tasks   │ │Projects │ │Planning │     ││ │
│  │  │ │         │ │         │ │         │ │  (AI)   │     ││ │
│  │  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘     ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐│ │
│  │  │ EXTENSIONS (V2+)                                     ││ │
│  │  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     ││ │
│  │  │ │   OKR   │ │ Finance │ │ Journal │ │ Reading │     ││ │
│  │  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘     ││ │
│  │  │ ┌─────────┐ ┌─────────┐ ┌─────────┐                 ││ │
│  │  │ │Learning │ │ Health  │ │  Notes  │                 ││ │
│  │  │ └─────────┘ └─────────┘ └─────────┘                 ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              🧪 LABS (Expérimentations)                   │ │
│  │                                                           │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                     │ │
│  │  │Module X │ │Module Y │ │  ...    │                     │ │
│  │  └─────────┘ └─────────┘ └─────────┘                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Dépendances entre Modules

```
                    ┌──────────────┐
                    │   DOMAINS    │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ ROUTINES │    │  TASKS   │    │ PROJECTS │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         │               │◄──────────────┘
         │               │
         └───────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │   PLANNING   │◄────── Events
          │     (AI)     │◄────── Mood/Energy
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │   METRICS    │
          │   ANALYTICS  │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │  AI INSIGHTS │
          └──────────────┘
```

---

## 5. Modèle de Données

### 5.1 Schéma Relationnel Simplifié

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │   domains   │         │  projects   │         │    tags     │           │
│  ├─────────────┤         ├─────────────┤         ├─────────────┤           │
│  │ id          │◄────────│ domain_id   │         │ id          │           │
│  │ name        │         │ name        │         │ name        │           │
│  │ icon        │         │ status      │         │ color       │           │
│  │ color       │         │ start_date  │         │ user_id     │           │
│  │ vision      │         │ target_date │         └──────┬──────┘           │
│  │ daily_budget│         │ user_id     │                │                  │
│  │ user_id     │         └──────┬──────┘                │                  │
│  └──────┬──────┘                │                       │                  │
│         │                       │                       │                  │
│         │         ┌─────────────┴───────────────────────┘                  │
│         │         │                                                        │
│         ▼         ▼                                                        │
│  ┌─────────────────────────┐         ┌─────────────────────────┐          │
│  │   routine_templates     │         │         tasks           │          │
│  ├─────────────────────────┤         ├─────────────────────────┤          │
│  │ id                      │         │ id                      │          │
│  │ domain_id          ─────┼────►    │ domain_id          ─────┼────►     │
│  │ category_moment         │         │ project_id         ─────┼────►     │
│  │ category_type           │         │ title                   │          │
│  │ name                    │         │ status                  │          │
│  │ constraints (JSON)      │         │ priority                │          │
│  │ recurrence (JSON)       │         │ due_date                │          │
│  │ priority                │         │ estimated_minutes       │          │
│  │ is_flexible             │         │ actual_minutes          │          │
│  │ user_id                 │         │ parent_task_id     ─────┼────►     │
│  └──────────┬──────────────┘         │ tags (array)            │          │
│             │                        │ user_id                 │          │
│             │                        └────────────┬────────────┘          │
│             ▼                                     │                       │
│  ┌─────────────────────────┐                      │                       │
│  │   routine_instances     │                      │                       │
│  ├─────────────────────────┤                      │                       │
│  │ id                      │                      │                       │
│  │ template_id        ─────┼────►                 │                       │
│  │ scheduled_date          │                      │                       │
│  │ scheduled_start         │                      │                       │
│  │ scheduled_end           │                      │                       │
│  │ actual_start            │                      │                       │
│  │ actual_end              │                      │                       │
│  │ actual_value            │                      │                       │
│  │ status                  │                      │                       │
│  │ completion_score        │                      │                       │
│  │ mood_before             │                      │                       │
│  │ mood_after              │                      │                       │
│  │ energy_level            │                      │                       │
│  │ notes                   │                      │                       │
│  │ user_id                 │                      │                       │
│  └──────────┬──────────────┘                      │                       │
│             │                                     │                       │
│             │    ┌────────────────────────────────┘                       │
│             │    │                                                        │
│             ▼    ▼                                                        │
│  ┌─────────────────────────┐                                              │
│  │ routine_instance_tasks  │   (Tâches faites pendant une routine)        │
│  ├─────────────────────────┤                                              │
│  │ id                      │                                              │
│  │ routine_instance_id ────┼────►                                         │
│  │ task_id            ─────┼────►                                         │
│  │ time_spent_minutes      │                                              │
│  │ notes                   │                                              │
│  └─────────────────────────┘                                              │
│                                                                           │
│  ┌─────────────────────────┐         ┌─────────────────────────┐          │
│  │   generated_plans       │         │      plan_slots         │          │
│  ├─────────────────────────┤         ├─────────────────────────┤          │
│  │ id                      │◄────────│ plan_id                 │          │
│  │ date                    │         │ start_time              │          │
│  │ status                  │         │ end_time                │          │
│  │ generation_params       │         │ slot_type               │          │
│  │ user_id                 │         │ entity_type             │          │
│  └─────────────────────────┘         │ entity_id               │          │
│                                      │ ai_reasoning            │          │
│  ┌─────────────────────────┐         │ was_executed            │          │
│  │       events            │         └─────────────────────────┘          │
│  ├─────────────────────────┤                                              │
│  │ id                      │                                              │
│  │ title                   │                                              │
│  │ domain_id               │                                              │
│  │ start_datetime          │                                              │
│  │ end_datetime            │                                              │
│  │ recurrence              │                                              │
│  │ source                  │                                              │
│  │ external_id             │                                              │
│  │ is_blocking             │                                              │
│  │ user_id                 │                                              │
│  └─────────────────────────┘                                              │
│                                                                           │
│  ┌─────────────────────────┐         ┌─────────────────────────┐          │
│  │    metric_entries       │         │       streaks           │          │
│  ├─────────────────────────┤         ├─────────────────────────┤          │
│  │ id                      │         │ id                      │          │
│  │ entity_type             │         │ entity_type             │          │
│  │ entity_id               │         │ entity_id               │          │
│  │ metric_name             │         │ current_streak          │          │
│  │ value                   │         │ longest_streak          │          │
│  │ unit                    │         │ last_completed_date     │          │
│  │ recorded_at             │         │ user_id                 │          │
│  │ user_id                 │         └─────────────────────────┘          │
│  └─────────────────────────┘                                              │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Flux Utilisateur

### 6.1 Onboarding (Premier Lancement)

```
1. BIENVENUE
   └── Explication du concept LifeOS

2. DOMAINES DE VIE
   └── Valider/personnaliser les domaines
   └── Définir la vision pour chaque domaine
   └── Optionnel : Budget temps par domaine

3. PREMIÈRES ROUTINES
   └── Importer depuis templates suggérés
   └── OU créer ses propres routines
   └── Minimum 3 routines pour commencer

4. PREMIÈRE GÉNÉRATION
   └── L'IA génère le planning du lendemain
   └── Validation/ajustement manuel
   └── Explication du fonctionnement

5. C'EST PARTI !
   └── Accès au dashboard
```

### 6.2 Usage Quotidien

```
┌─────────────────────────────────────────────────────────────┐
│                    CYCLE QUOTIDIEN                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌙 VEILLE AU SOIR                                          │
│  │                                                          │
│  ├── Revue de la journée                                    │
│  │   └── Marquer routines/tâches faites                     │
│  │   └── Ajouter notes/humeur                               │
│  │                                                          │
│  ├── Préparation lendemain                                  │
│  │   └── Voir tâches prioritaires                           │
│  │   └── Vérifier calendrier (events)                       │
│  │                                                          │
│  └── Génération planning                                    │
│      └── IA propose le planning                             │
│      └── Ajustements si besoin                              │
│      └── Validation                                         │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  🌅 LE JOUR J                                               │
│  │                                                          │
│  ├── Consultation planning                                  │
│  │   └── Vue timeline du jour                               │
│  │   └── Notifications/rappels                              │
│  │                                                          │
│  ├── Exécution                                              │
│  │   └── Cocher les routines faites                         │
│  │   └── Tracker temps sur tâches                           │
│  │   └── Lier tâches aux routines si pertinent              │
│  │                                                          │
│  ├── Ajustements temps réel                                 │
│  │   └── Déplacer un slot                                   │
│  │   └── Skip une routine (avec raison)                     │
│  │   └── Ajouter tâche urgente                              │
│  │                                                          │
│  └── Check-ins (optionnel)                                  │
│      └── Mood/Energy à intervalles                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Usage Hebdomadaire

```
WEEKLY REVIEW (Dimanche soir recommandé)
│
├── 📊 Métriques de la semaine
│   ├── Taux complétion routines par catégorie
│   ├── Temps par domaine vs budget
│   ├── Tâches complétées / ajoutées
│   └── Streaks actuels
│
├── 🔍 Analyse IA
│   ├── "Tu as respecté 85% de tes routines matinales"
│   ├── "Domaine Spiritualité sous-investi (-2h)"
│   ├── "Meilleure productivité le mardi matin"
│   └── "Suggestion : déplacer lecture à 6h30"
│
├── 📝 Réflexion personnelle
│   ├── Qu'est-ce qui a bien marché ?
│   ├── Qu'est-ce qui a bloqué ?
│   └── Ajustements pour la semaine prochaine
│
└── 🎯 Planification semaine suivante
    ├── Objectifs de la semaine
    ├── Tâches prioritaires
    └── Événements à venir
```

---

## 7. Intelligence Artificielle

### 7.1 Rôles de l'IA dans LifeOS

| Fonction | Description | Input | Output |
|----------|-------------|-------|--------|
| **Scheduler** | Génère le planning optimal | Routines, Tasks, Events, Préférences | Planning journalier |
| **Analyzer** | Détecte patterns et anomalies | Historique exécution | Insights |
| **Advisor** | Suggère améliorations | Métriques + Objectifs | Recommandations |
| **Arbitrator** | Résout conflits de priorité | Conflit routine/tâche | Décision justifiée |

### 7.2 Logique de Scheduling

```python
# Pseudo-algorithme de génération de planning

def generate_daily_plan(user, date):
    
    # 1. Récupérer les contraintes fixes
    events = get_blocking_events(user, date)
    
    # 2. Récupérer les routines du jour
    routines = get_scheduled_routines(user, date)
    
    # 3. Récupérer les tâches à planifier
    tasks = get_pending_tasks(user, priority_sorted=True)
    
    # 4. Récupérer l'historique pour personnalisation
    history = get_user_history(user, days=30)
    patterns = analyze_patterns(history)
    
    # 5. Créer les slots disponibles
    available_slots = calculate_available_time(
        date,
        blocked_by=events,
        wake_time=user.preferences.wake_time,
        sleep_time=user.preferences.sleep_time
    )
    
    # 6. Placer les routines (priorité aux non-flexibles)
    for routine in sorted(routines, key=lambda r: r.is_flexible):
        best_slot = find_optimal_slot(
            routine,
            available_slots,
            patterns,  # ex: "user performs better morning"
            constraints=routine.constraints
        )
        place_routine(routine, best_slot)
        available_slots = update_availability(available_slots, best_slot)
    
    # 7. Placer les tâches
    for task in tasks:
        if task.fits_in_available_time(available_slots):
            best_slot = find_optimal_slot(task, available_slots, patterns)
            place_task(task, best_slot)
            available_slots = update_availability(available_slots, best_slot)
    
    # 8. Ajouter buffers et pauses
    add_breaks_and_buffers(plan)
    
    # 9. Valider cohérence
    validate_plan(plan)
    
    # 10. Générer les raisonnements
    for slot in plan.slots:
        slot.ai_reasoning = generate_reasoning(slot, patterns, user.goals)
    
    return plan
```

### 7.3 Arbitrage Routine vs Tâche Urgente

Quand une tâche urgente entre en conflit avec une routine :

```
INPUTS pour décision :
├── Routine
│   ├── Importance (priorité 1-5)
│   ├── Streak actuel (45 jours)
│   ├── Flexibilité (peut-elle être déplacée ?)
│   └── Impact historique sur humeur/énergie
│
├── Tâche urgente
│   ├── Deadline (dans 2h)
│   ├── Conséquence si non faite (pénalité client)
│   ├── Durée estimée (1h)
│   └── Peut-elle être déléguée ?
│
└── Contexte utilisateur
    ├── Avance/retard sur routine cette semaine
    ├── Historique de choix similaires
    └── Préférence exprimée

DÉCISION IA :
├── Option A : Faire la tâche, skip routine
│   └── "Tu es en avance de 2 sessions sur ta routine sport.
│        La deadline client est critique. Skip recommandé."
│
├── Option B : Routine d'abord, tâche après
│   └── "Ta routine méditation impacte ta concentration +30%.
│        Fais-la, tu seras plus efficace sur la tâche après."
│
└── Option C : Compromis
    └── "Version courte de la routine (10min au lieu de 30),
         puis tâche urgente."
```

---

## 8. Métriques & Analytics

### 8.1 Métriques Trackées

#### Par Routine
- Taux de complétion (%)
- Score moyen de complétion
- Streak actuel / Longest streak
- Horaire moyen d'exécution
- Écart planifié vs réalisé
- Corrélation avec humeur/énergie

#### Par Domaine
- Temps investi (réel vs budget)
- Répartition des activités
- Évolution sur le temps
- Score d'équilibre

#### Par Projet / Tâche
- Temps estimé vs réel
- Vélocité (tâches/semaine)
- Taux de complétion
- Âge moyen des tâches

#### Global
- Score LifeOS (métrique composite)
- Tendance discipline (↑↓→)
- Jours parfaits (100% routines)
- Balance vie (radar chart des domaines)

### 8.2 Visualisations

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD ANALYTICS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   SCORE GLOBAL      │  │   STREAKS           │          │
│  │                     │  │                     │          │
│  │       87%           │  │  🔥 Méditation: 45j │          │
│  │    ↑ +5% vs last    │  │  🔥 Sport: 12j      │          │
│  │        week         │  │  🔥 Lecture: 8j     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   RÉPARTITION TEMPS PAR DOMAINE (Semaine)           │   │
│  │                                                     │   │
│  │   Spiritualité   ████████░░ 8h / 10h (80%)         │   │
│  │   Carrière       ████████████████ 32h / 30h (107%) │   │
│  │   Santé          ██████░░░░ 6h / 10h (60%)         │   │
│  │   Relations      ████████░░ 8h / 10h (80%)         │   │
│  │   Dev Perso      ████░░░░░░ 4h / 7h (57%)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   ROUTINES - TAUX COMPLETION (7 derniers jours)     │   │
│  │                                                     │   │
│  │   100% │       ●           ●                       │   │
│  │    80% │   ●       ●   ●       ●                   │   │
│  │    60% │                           ●               │   │
│  │    40% │                                           │   │
│  │        └───────────────────────────────────────    │   │
│  │          L   M   M   J   V   S   D                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   💡 INSIGHTS IA                                    │   │
│  │                                                     │   │
│  │   • Tu skip ta routine sport 60% des vendredis     │   │
│  │     → Suggestion: Routine plus légère le vendredi  │   │
│  │                                                     │   │
│  │   • Ta productivité chute de 40% après 16h         │   │
│  │     → Suggestion: Tâches créatives le matin        │   │
│  │                                                     │   │
│  │   • Domaine Santé en déclin depuis 2 semaines      │   │
│  │     → Action: Revoir tes routines santé            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Intégrations

### 9.1 Google Calendar

| Direction | Description |
|-----------|-------------|
| **Import** | Récupérer les événements comme contraintes |
| **Export** | Pousser le planning généré vers GCal |
| **Sync** | Bidirectionnel, configurable |

#### Configuration Utilisateur
- Calendriers à synchroniser (sélection)
- Quoi synchroniser : Events seulement / Routines aussi / Tout
- Fréquence de sync
- Gestion des conflits

### 9.2 Futures Intégrations (V2+)

- **Notion** : Import/export tâches et notes
- **Todoist** : Sync tâches
- **Apple Health / Google Fit** : Données santé
- **Calendly** : Events automatiques
- **Slack** : Notifications, statut

---

## 10. Roadmap

### Phase 1 : Fondations LifeOS (MVP)
*Objectif : Système utilisable pour la planification quotidienne*

```
✅ Auth & Users (déjà fait)
✅ Admin Panel (déjà fait)

🔲 Domains
   ├── CRUD domaines
   ├── Seeds par défaut
   └── Budget temps optionnel

🔲 Routines
   ├── Templates CRUD
   ├── Système de récurrence
   ├── Catégorisation (moment + type)
   ├── Instances (génération + tracking)
   └── Scoring de complétion

🔲 Tasks
   ├── CRUD tâches
   ├── Statuts et priorités
   ├── Lien avec projets
   └── Estimation temps

🔲 Projects
   ├── CRUD projets
   └── Agrégation tâches

🔲 Planning AI
   ├── Génération planning journalier
   ├── Algorithme de placement
   └── UI calendrier/timeline

🔲 Basic Analytics
   ├── Taux complétion
   ├── Streaks
   └── Temps par domaine
```

### Phase 2 : Intelligence & Insights
*Objectif : L'IA devient vraiment utile*

```
🔲 AI Insights
   ├── Détection patterns
   ├── Suggestions personnalisées
   └── Prédictions

🔲 Google Calendar Sync
   ├── OAuth flow
   ├── Import events
   └── Export planning

🔲 Mood & Energy Tracking
   ├── Check-ins
   ├── Corrélations
   └── Visualisations

🔲 Advanced Analytics
   ├── Dashboards riches
   ├── Comparaisons périodes
   └── Export données
```

### Phase 3 : OKR & Alignement Stratégique
*Objectif : Connecter actions quotidiennes à vision long terme*

```
🔲 OKR Module
   ├── Objectifs
   ├── Key Results
   ├── Liens avec projets/routines
   └── Progression tracking
```

### Phase 4+ : Extensions LifeOS
*Modules additionnels selon priorités*

```
🔲 Finance (revenus, dépenses, budgets)
🔲 Journal (journalisation, gratitude)
🔲 Reading (livres, articles, highlights)
🔲 Learning (cours, skills, certifications)
🔲 Health (workouts détaillés, nutrition, sleep)
🔲 Notes (capture, organisation, liens)
```

---

## 11. Modules Additionnels

### 11.1 Principe : Modules Autonomes mais Connectés

Chaque module additionnel (Finance, Journal, Reading, etc.) est :
1. **Autonome** : Peut fonctionner seul (CRUD propre, UI propre)
2. **Connecté** : S'intègre aux fondations communes (Domains, Metrics, AI)
3. **Optionnel** : L'utilisateur active uniquement ce qu'il veut

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LIFEOS FOUNDATION                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Domains  │ │  Tags    │ │ Metrics  │ │    AI    │ │  Sync    │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       │            │            │            │            │             │
│       └────────────┴────────────┴────────────┴────────────┘             │
│                                 │                                        │
│                    Interface commune (hooks, types, API)                 │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    FINANCE    │       │    JOURNAL    │       │    READING    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ • Transactions│       │ • Daily Entry │       │ • Books       │
│ • Budgets     │       │ • Gratitude   │       │ • Articles    │
│ • Categories  │       │ • Reflection  │       │ • Highlights  │
│ • Reports     │       │ • Mood logs   │       │ • Progress    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ UTILISE :     │       │ UTILISE :     │       │ UTILISE :     │
│ → Domains     │       │ → Domains     │       │ → Domains     │
│ → Tags        │       │ → Tags        │       │ → Tags        │
│ → Metrics     │       │ → Metrics     │       │ → Metrics     │
│ → AI Insights │       │ → AI Insights │       │ → AI Insights │
└───────────────┘       └───────────────┘       └───────────────┘
```

### 11.2 Exemple : Module Finance

```
MODULE: FINANCE
│
├── 📊 Données Propres
│   ├── transactions (dépenses, revenus)
│   ├── accounts (comptes bancaires)
│   ├── budgets (par catégorie)
│   └── recurring_transactions (abonnements)
│
├── 🔗 Connexion aux Fondations
│   │
│   ├── DOMAINS
│   │   └── Chaque transaction → domain_id
│   │       Ex: "Achat livre" → Développement Personnel
│   │       Ex: "Salaire" → Carrière & Business
│   │
│   ├── TAGS
│   │   └── Tags réutilisables
│   │       Ex: ["nécessaire", "plaisir", "investissement"]
│   │
│   ├── METRICS
│   │   └── Enregistre dans le système commun :
│   │       - metric_entries (entity_type: "transaction")
│   │       - Permet les analytics cross-modules
│   │
│   └── AI ENGINE
│       └── Génère des insights :
│           "Tu dépenses 40% en Loisirs mais ton budget est 20%"
│           "Suggestion: Réduire abonnements streaming"
│
├── 📈 Dashboard Finance
│   ├── Balance actuelle
│   ├── Dépenses par domaine (graphique)
│   ├── Budget vs Réel
│   └── Prédictions IA
│
└── 🔄 Interactions avec autres modules
    │
    ├── ROUTINES
    │   └── "Review finances" comme routine mensuelle
    │
    ├── TASKS
    │   └── "Payer facture X" comme tâche avec deadline
    │
    └── PLANNING
        └── Allouer du temps pour "gestion finances"
```

### 11.3 Exemple : Module Journal

```
MODULE: JOURNAL
│
├── 📊 Données Propres
│   ├── journal_entries (entrées quotidiennes)
│   ├── gratitude_items (3 choses positives/jour)
│   ├── reflections (réflexions hebdo/mensuel)
│   └── prompts (questions de réflexion)
│
├── 🔗 Connexion aux Fondations
│   │
│   ├── DOMAINS
│   │   └── Entrée peut référencer plusieurs domaines
│   │       Ex: "Réflexion sur ma carrière et mes relations"
│   │
│   ├── METRICS
│   │   └── Mood tracking centralisé
│   │       → Corrélation avec routines/productivité
│   │
│   └── AI ENGINE
│       └── Analyse sémantique des entrées :
│           "Tes journaux mentionnent souvent 'fatigue' le mercredi"
│           "Pattern détecté: meilleure humeur après routine sport"
│
└── 🔄 Interactions
    │
    ├── ROUTINES
    │   └── Instance de routine → lien vers journal du jour
    │       "Comment je me sentais pendant ma méditation"
    │
    ├── PLANNING
    │   └── Slot "Journaling" dans le planning quotidien
    │
    └── MOOD (fondation)
        └── Check-in mood → proposer d'écrire
```

### 11.4 Exemple : Module Reading

```
MODULE: READING
│
├── 📊 Données Propres
│   ├── books (livres)
│   ├── articles (articles web)
│   ├── highlights (extraits importants)
│   ├── reading_sessions (sessions de lecture)
│   └── book_notes (notes par livre)
│
├── 🔗 Connexion aux Fondations
│   │
│   ├── DOMAINS
│   │   └── Livre → domain_id
│   │       Ex: "Atomic Habits" → Développement Personnel
│   │       Ex: "Clean Code" → Carrière & Business
│   │
│   ├── TAGS
│   │   └── ["must-read", "en-cours", "à-relire", "classique"]
│   │
│   ├── METRICS
│   │   └── Temps de lecture tracké
│   │       → Contribue au budget temps du domaine
│   │
│   └── AI ENGINE
│       └── "Tu lis 80% Carrière, 0% Spiritualité cette année"
│           "Suggestion: 'Mere Christianity' aligné avec tes objectifs"
│
└── 🔄 Interactions
    │
    ├── ROUTINES
    │   └── Routine "Lecture 30min" → log la session + pages lues
    │
    ├── TASKS
    │   └── "Terminer livre X" avec deadline
    │
    ├── OKR (V2)
    │   └── KR: "Lire 30 livres cette année"
    │       → Progression automatique
    │
    └── NOTES (autre module)
        └── Highlights → exportables vers Notes
```

### 11.5 Pattern Technique d'Intégration

#### Structure de Fichiers par Module

```
src/features/
├── lifeos/                    # Fondations partagées
│   ├── domains/
│   ├── metrics/
│   ├── ai/
│   └── shared/
│
├── planning/                  # Module Planning (V1)
│   ├── routines/
│   ├── tasks/
│   ├── projects/
│   └── scheduler/
│
├── finance/                   # Module Finance (V2+)
│   ├── schema/
│   │   └── finance.schema.ts
│   ├── services/
│   │   └── finance.service.ts
│   ├── actions/
│   │   └── finance.actions.ts
│   ├── components/
│   │   ├── transactions-list.tsx
│   │   ├── budget-overview.tsx
│   │   └── finance-dashboard.tsx
│   └── hooks/
│       └── use-finance.ts
│
├── journal/                   # Module Journal (V2+)
│   └── ...
│
└── reading/                   # Module Reading (V2+)
    └── ...
```

#### Interface Commune (Hooks)

Chaque module utilise les mêmes hooks pour accéder aux fondations :

```typescript
// Exemple dans le module Finance

import { useDomains } from '@/features/lifeos/domains/hooks';
import { useMetrics } from '@/features/lifeos/metrics/hooks';
import { useAI } from '@/features/lifeos/ai/hooks';
import { useTags } from '@/features/lifeos/tags/hooks';

function TransactionForm() {
  const { domains } = useDomains();           // Liste des domaines
  const { tags } = useTags();                 // Tags disponibles
  const { recordMetric } = useMetrics();      // Enregistrer une métrique
  
  const handleSave = async (transaction) => {
    // Sauvegarder transaction
    await saveTransaction(transaction);
    
    // Enregistrer dans le système de métriques commun
    await recordMetric({
      entity_type: 'transaction',
      entity_id: transaction.id,
      metric_name: 'amount',
      value: transaction.amount,
      unit: 'EUR'
    });
  };
}
```

#### Tables Supabase

Chaque module a ses propres tables mais référence les tables communes :

```sql
-- Module Finance
CREATE TABLE finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  domain_id UUID REFERENCES domains(id),      -- ← Fondation commune
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  description TEXT,
  date DATE NOT NULL,
  tags TEXT[],                                -- ← Utilise le système de tags
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Les métriques vont dans la table commune
-- metric_entries avec entity_type = 'transaction'
```

### 11.6 Activation des Modules

L'utilisateur choisit quels modules activer via la table existante :

```typescript
// user_module_access (table existante)
{
  user_id: "xxx",
  module_slug: "finance",    // Activé
  enabled: true
},
{
  user_id: "xxx", 
  module_slug: "journal",    // Pas encore activé
  enabled: false
}
```

Le sidebar et le dashboard s'adaptent automatiquement aux modules activés (déjà en place via `useModuleAccess`).

### 11.7 Cross-Module Analytics

Grâce au système de métriques commun, on peut faire des analyses croisées :

```
┌─────────────────────────────────────────────────────────────┐
│                    INSIGHTS CROSS-MODULES                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  "Les jours où tu médites le matin (ROUTINES),              │
│   tu dépenses 30% moins impulsivement (FINANCE)"           │
│                                                             │
│  "Tu lis plus (READING) les semaines où                     │
│   ton humeur est positive (JOURNAL)"                        │
│                                                             │
│  "Tes meilleures sessions de code (ROUTINES)                │
│   corrèlent avec 7h+ de sommeil (HEALTH)"                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.8 Résumé

| Aspect | Comment ça marche |
|--------|-------------------|
| **Autonomie** | Chaque module a ses propres tables, services, UI |
| **Connexion** | Tous utilisent Domains, Tags, Metrics, AI via hooks communs |
| **Activation** | Via `user_module_access`, sidebar/dashboard s'adaptent |
| **Analytics** | Métriques centralisées permettent insights cross-modules |
| **Développement** | Ajouter un module = créer un feature folder + tables + brancher aux fondations |

---

## Annexes

### A. Glossaire

| Terme | Définition |
|-------|------------|
| **Domaine** | Grande catégorie de vie (Santé, Carrière, etc.) |
| **Routine** | Action récurrente intentionnelle |
| **Template** | Modèle de routine (la définition) |
| **Instance** | Occurrence spécifique d'une routine |
| **Slot** | Créneau horaire dans un planning |
| **Streak** | Série consécutive de succès |
| **Score** | Évaluation de complétion (0-100%) |

### B. Inspirations

- Notion (flexibilité, bases de données)
- Todoist (simplicité tâches)
- Habitica (gamification)
- Superhuman (UX fluide)
- Linear (design épuré)
- Rise (sommeil intelligent)
- Oura (insights santé)

### C. Principes UX

1. **Friction minimale** : Ajouter/compléter en 1-2 clics
2. **Feedback immédiat** : Voir l'impact de chaque action
3. **Clarté** : Toujours savoir quoi faire ensuite
4. **Motivation** : Célébrer les victoires, encourager après échecs
5. **Flexibilité** : S'adapter à l'utilisateur, pas l'inverse

---

*Ce document est vivant et sera mis à jour au fur et à mesure des itérations.*

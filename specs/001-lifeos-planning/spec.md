# Feature Specification: LifeOS Planning V1

**Feature Branch**: `001-lifeos-planning`  
**Created**: 2025-01-26  
**Status**: Draft  
**Input**: Module LifeOS Planning V1 - système intelligent de génération automatique de plannings basés sur routines et contraintes, avec tracking prévu vs réalisé et insights IA

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configurer mes Domaines de Vie (Priority: P1)

En tant qu'utilisateur, je veux définir et personnaliser mes domaines de vie afin que toutes mes activités soient organisées selon mes priorités personnelles.

**Why this priority**: Les domaines sont la fondation de tout le système. Chaque routine, tâche et projet sera rattaché à un domaine. Sans domaines, rien d'autre ne peut fonctionner.

**Independent Test**: L'utilisateur peut créer, modifier, supprimer et réorganiser ses domaines. L'écran affiche les domaines avec leurs icônes et couleurs. Valeur livrée : organisation visuelle de sa vie.

**Acceptance Scenarios**:

1. **Given** un nouvel utilisateur avec les domaines par défaut, **When** il accède à la page Domaines, **Then** il voit les 8 domaines pré-configurés (Spiritualité, Santé, Carrière, Développement Personnel, Relations, Loisirs, Finance, Environnement)
2. **Given** un utilisateur sur la page Domaines, **When** il clique sur "Ajouter un domaine" et remplit le formulaire (nom, icône, couleur, vision), **Then** le domaine est créé et apparaît dans la liste
3. **Given** un utilisateur avec des domaines existants, **When** il modifie un domaine (nom, couleur, vision), **Then** les changements sont sauvegardés et reflétés partout dans l'app
4. **Given** un utilisateur avec un domaine sans éléments liés, **When** il supprime ce domaine, **Then** le domaine est supprimé de la liste
5. **Given** un utilisateur avec un domaine qui a des routines/tâches liées, **When** il tente de supprimer ce domaine, **Then** un message lui demande de réassigner ou supprimer les éléments liés d'abord

---

### User Story 2 - Créer et Gérer mes Routines (Priority: P1)

En tant qu'utilisateur, je veux créer des routines récurrentes avec des contraintes flexibles afin d'ancrer des habitudes positives dans ma vie quotidienne.

**Why this priority**: Les routines sont le cœur de LifeOS - ce sont les habitudes que l'utilisateur veut construire. Sans routines, pas de planning à générer.

**Independent Test**: L'utilisateur peut créer une routine avec son nom, domaine, récurrence, et contraintes optionnelles. La routine apparaît dans sa liste. Valeur livrée : vision claire de ses habitudes à développer.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur la page Routines, **When** il clique sur "Nouvelle routine" et remplit : nom ("Méditation matinale"), domaine (Spiritualité), catégorie moment (Matin), catégorie type (Spirituelle), **Then** la routine est créée avec les paramètres par défaut
2. **Given** un utilisateur créant une routine, **When** il configure les contraintes avec "Durée requise: Oui, 30 minutes", **Then** cette contrainte est enregistrée et sera utilisée pour la génération du planning
3. **Given** un utilisateur créant une routine, **When** il configure les contraintes avec "Créneau requis: Oui, 06:00-06:30", **Then** la routine sera placée dans ce créneau exact lors de la génération
4. **Given** un utilisateur créant une routine, **When** il définit la récurrence "Tous les jours sauf week-end", **Then** la routine ne génère des instances que du lundi au vendredi
5. **Given** un utilisateur avec des routines existantes, **When** il modifie une routine, **Then** les futures instances reflètent les changements (les instances passées restent inchangées)
6. **Given** un utilisateur avec une routine, **When** il la supprime, **Then** la routine et ses futures instances sont supprimées, les instances passées restent pour l'historique
7. **Given** un utilisateur, **When** il visualise sa liste de routines, **Then** il voit chaque routine avec son domaine, catégorie, récurrence et statut du streak actuel

---

### User Story 3 - Créer et Gérer mes Tâches (Priority: P1)

En tant qu'utilisateur, je veux créer des tâches ponctuelles avec priorités et estimations afin de gérer mes actions non-récurrentes.

**Why this priority**: Les tâches représentent le travail concret à accomplir. Avec domaines et routines, elles forment le trio fondamental pour générer un planning.

**Independent Test**: L'utilisateur peut créer, visualiser et gérer des tâches avec leurs attributs. Valeur livrée : liste de tâches organisée par domaine et projet.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur la page Tâches, **When** il crée une tâche avec titre, domaine, priorité (haute/moyenne/basse) et durée estimée, **Then** la tâche est créée avec statut "TODO"
2. **Given** un utilisateur créant une tâche, **When** il associe la tâche à un projet existant, **Then** la tâche apparaît dans la vue du projet
3. **Given** un utilisateur créant une tâche, **When** il définit une date d'échéance et coche "Deadline stricte", **Then** le planning priorisera cette tâche avant la deadline
4. **Given** un utilisateur avec une tâche TODO, **When** il la passe en "IN_PROGRESS", **Then** le statut change et un timer de suivi peut être lancé
5. **Given** un utilisateur avec une tâche IN_PROGRESS, **When** il la marque "DONE", **Then** le statut change, la durée réelle est enregistrée
6. **Given** un utilisateur, **When** il filtre ses tâches par domaine ou par projet, **Then** seules les tâches correspondantes sont affichées
7. **Given** un utilisateur, **When** il trie ses tâches par priorité, **Then** les tâches haute priorité apparaissent en premier

---

### User Story 4 - Créer et Gérer mes Projets (Priority: P2)

En tant qu'utilisateur, je veux regrouper mes tâches en projets afin d'avoir une vision organisée de mes objectifs à moyen terme.

**Why this priority**: Les projets sont utiles mais pas bloquants. Un utilisateur peut fonctionner avec juste des tâches sans projet au début.

**Independent Test**: L'utilisateur peut créer un projet, y rattacher des tâches, et voir la progression. Valeur livrée : vue projet avec tâches groupées.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur la page Projets, **When** il crée un projet avec nom, domaine, description, et dates (début/fin optionnelles), **Then** le projet est créé avec statut "Actif"
2. **Given** un utilisateur avec un projet, **When** il ajoute des tâches au projet, **Then** la progression du projet se calcule automatiquement (% tâches complétées)
3. **Given** un utilisateur avec un projet, **When** il visualise le projet, **Then** il voit toutes les tâches rattachées, le temps total investi, et la progression
4. **Given** un utilisateur avec un projet terminé, **When** il archive le projet, **Then** le projet passe en statut "Archivé" et sort de la vue active

---

### User Story 5 - Générer mon Planning Quotidien (Priority: P1)

En tant qu'utilisateur, je veux que l'IA génère automatiquement mon planning quotidien en plaçant intelligemment mes routines et tâches disponibles.

**Why this priority**: La génération de planning est LA fonctionnalité différenciante de LifeOS. C'est la promesse centrale du produit.

**Independent Test**: L'utilisateur demande un planning pour demain, l'IA le génère, l'utilisateur le visualise. Valeur livrée : journée planifiée automatiquement.

**Acceptance Scenarios**:

1. **Given** un utilisateur avec des routines configurées, **When** il demande la génération du planning pour une date, **Then** l'IA place toutes les routines prévues ce jour-là selon leurs contraintes
2. **Given** un utilisateur avec des tâches prioritaires, **When** le planning est généré, **Then** les tâches sont placées dans les créneaux disponibles en respectant leur priorité et estimations
3. **Given** un utilisateur avec des routines à créneau fixe, **When** le planning est généré, **Then** ces routines sont placées exactement au créneau défini (non déplaçables)
4. **Given** un utilisateur avec des routines flexibles, **When** le planning est généré, **Then** ces routines sont placées au meilleur moment selon les disponibilités
5. **Given** un planning généré, **When** l'utilisateur le visualise, **Then** chaque slot affiche : l'élément planifié, le type (routine/tâche), et le raisonnement IA
6. **Given** un planning avec conflits impossibles à résoudre, **When** le planning est généré, **Then** l'IA liste les éléments non placés avec explication

---

### User Story 6 - Visualiser mon Planning en Timeline (Priority: P1)

En tant qu'utilisateur, je veux voir mon planning sous forme de timeline journalière afin de comprendre l'organisation de ma journée d'un coup d'œil.

**Why this priority**: Sans visualisation, le planning généré est inutilisable. C'est l'interface principale d'interaction quotidienne.

**Independent Test**: L'utilisateur voit une timeline verticale avec tous les slots de la journée. Valeur livrée : vue claire et actionnable de la journée.

**Acceptance Scenarios**:

1. **Given** un utilisateur avec un planning généré, **When** il accède à la vue Planning, **Then** il voit une timeline verticale avec les heures et les slots colorés par domaine
2. **Given** un planning affiché, **When** l'utilisateur clique sur un slot, **Then** il voit les détails : routine/tâche, domaine, durée, et raisonnement IA
3. **Given** un planning affiché, **When** l'utilisateur veut voir un autre jour, **Then** il peut naviguer avec des flèches ou un sélecteur de date
4. **Given** un planning avec le jour actuel, **When** l'heure avance, **Then** un indicateur visuel montre "l'heure actuelle" sur la timeline

---

### User Story 7 - Tracker l'Exécution de mes Routines (Priority: P1)

En tant qu'utilisateur, je veux marquer mes routines comme faites et enregistrer les valeurs réelles afin de suivre ma discipline et progression.

**Why this priority**: Le tracking est essentiel pour fermer la boucle planifié → exécuté. Sans tracking, pas de métriques ni d'amélioration.

**Independent Test**: L'utilisateur marque une routine comme faite avec valeurs réelles. L'instance est enregistrée. Valeur livrée : historique de ses habitudes.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur la timeline avec une routine planifiée, **When** il clique "Fait", **Then** l'instance passe en statut "Completed" avec l'heure actuelle comme heure de fin réelle
2. **Given** un utilisateur complétant une routine avec valeur cible, **When** il saisit la valeur réelle (ex: 250 pompes sur 300), **Then** le score de complétion est calculé automatiquement
3. **Given** un utilisateur complétant une routine, **When** il saisit optionnellement son humeur et énergie, **Then** ces données sont enregistrées pour l'analyse future
4. **Given** un utilisateur qui n'a pas fait une routine, **When** il clique "Skip" et sélectionne une raison, **Then** l'instance passe en statut "Skipped" avec la raison
5. **Given** un utilisateur avec une routine complétée plusieurs jours de suite, **When** il complète aujourd'hui aussi, **Then** son streak s'incrémente et s'affiche

---

### User Story 8 - Tracker l'Exécution de mes Tâches (Priority: P2)

En tant qu'utilisateur, je veux tracker le temps passé sur mes tâches afin de comparer estimations et réalité et améliorer mes estimations futures.

**Why this priority**: Important mais secondaire par rapport au tracking des routines. L'utilisateur peut commencer sans timer.

**Independent Test**: L'utilisateur lance un timer sur une tâche, l'arrête, le temps est enregistré. Valeur livrée : données temps réel vs estimé.

**Acceptance Scenarios**:

1. **Given** un utilisateur avec une tâche en cours, **When** il lance le timer, **Then** le temps commence à s'accumuler pour cette tâche
2. **Given** un utilisateur avec un timer actif, **When** il met en pause ou arrête, **Then** le temps passé est enregistré
3. **Given** un utilisateur complétant une tâche, **When** il la marque "Done", **Then** le temps total passé est sauvegardé et comparé à l'estimation

---

### User Story 9 - Lier Tâches aux Routines de Travail (Priority: P2)

En tant qu'utilisateur, je veux associer les tâches sur lesquelles j'ai travaillé pendant une routine de travail (ex: "Deep Work 8h-12h") afin de valider la routine ET savoir précisément ce que j'ai accompli.

**Why this priority**: Feature avancée qui enrichit le tracking mais pas indispensable au démarrage.

**Independent Test**: L'utilisateur complète une routine de travail et y associe les tâches travaillées avec le temps passé sur chacune.

**Acceptance Scenarios**:

1. **Given** un utilisateur complétant une routine de type "Travail", **When** il clique "Associer des tâches", **Then** il peut sélectionner parmi ses tâches en cours
2. **Given** une association tâche-routine, **When** l'utilisateur saisit le temps passé sur chaque tâche, **Then** la somme ne peut pas dépasser la durée de la routine
3. **Given** des tâches associées à une routine, **When** il visualise l'historique de la routine, **Then** il voit les tâches travaillées avec le temps par tâche

---

### User Story 10 - Voir mes Statistiques de Base (Priority: P2)

En tant qu'utilisateur, je veux voir mes statistiques de complétion et mes streaks afin de visualiser ma progression et rester motivé.

**Why this priority**: Les stats sont motivantes mais l'utilisateur peut fonctionner quelques jours sans. Important dès qu'il y a de l'historique.

**Independent Test**: L'utilisateur accède à un dashboard avec ses métriques clés. Valeur livrée : feedback visuel sur sa discipline.

**Acceptance Scenarios**:

1. **Given** un utilisateur avec de l'historique, **When** il accède au Dashboard, **Then** il voit son taux de complétion global des routines (semaine en cours)
2. **Given** un utilisateur, **When** il consulte ses streaks, **Then** il voit la liste de ses routines avec streak actuel et record
3. **Given** un utilisateur, **When** il consulte le temps par domaine, **Then** il voit un graphique répartition temps prévu vs réalisé par domaine

---

### User Story 11 - Ajuster mon Planning Manuellement (Priority: P2)

En tant qu'utilisateur, je veux pouvoir ajuster mon planning généré (déplacer, supprimer un slot) afin de m'adapter aux imprévus.

**Why this priority**: Flexibilité importante mais l'utilisateur peut faire avec un planning "as-is" au début.

**Independent Test**: L'utilisateur déplace un slot dans la timeline, le planning se réorganise.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur la timeline, **When** il drag-and-drop un slot flexible, **Then** le slot est déplacé à la nouvelle position
2. **Given** un slot à créneau fixe (routine non-flexible), **When** l'utilisateur tente de le déplacer, **Then** l'action est bloquée avec message explicatif
3. **Given** un utilisateur, **When** il supprime un slot du planning, **Then** le slot disparaît et le temps est libéré

---

### Edge Cases

- Que se passe-t-il si l'utilisateur n'a aucune routine configurée ? → Le planning est vide avec message d'invitation à créer des routines
- Que se passe-t-il si toutes les routines sont en conflit horaire ? → L'IA place ce qu'elle peut et liste les conflits non résolus
- Que se passe-t-il si l'utilisateur supprime un domaine avec des routines liées ? → Blocage avec demande de réassigner d'abord
- Que se passe-t-il si la génération IA échoue (erreur réseau/API) ? → Message d'erreur avec option de retry
- Que se passe-t-il si l'utilisateur complète une routine passée (oubli) ? → Il peut compléter jusqu'à 7 jours en arrière
- Que se passe-t-il si deux routines ont le même créneau fixe ? → Conflit signalé à la création de la 2ème routine

---

## Requirements *(mandatory)*

### Functional Requirements

#### Domaines
- **FR-001**: Le système DOIT afficher 8 domaines par défaut au premier accès (Spiritualité, Santé & Bien-être, Carrière & Business, Développement Personnel, Relations & Social, Loisirs & Détente, Finance & Patrimoine, Environnement & Cadre de vie)
- **FR-002**: Les utilisateurs DOIVENT pouvoir créer de nouveaux domaines avec nom, icône, couleur et vision
- **FR-003**: Les utilisateurs DOIVENT pouvoir modifier tous les attributs d'un domaine existant
- **FR-004**: Les utilisateurs DOIVENT pouvoir supprimer un domaine uniquement s'il n'a aucun élément lié
- **FR-005**: Chaque domaine DOIT avoir un budget temps journalier/hebdomadaire optionnel

#### Routines
- **FR-010**: Les utilisateurs DOIVENT pouvoir créer des routines avec : nom, domaine, catégorie moment, catégorie type
- **FR-011**: Les routines DOIVENT supporter des contraintes flexibles : durée (requise ou non), créneau horaire (requis ou non), valeur cible (requise ou non)
- **FR-012**: Les routines DOIVENT supporter plusieurs types de récurrence : quotidien, jours spécifiques, intervalle, hebdomadaire, mensuel
- **FR-013**: Le système DOIT générer automatiquement les instances de routine selon la récurrence
- **FR-014**: Les utilisateurs DOIVENT pouvoir marquer une instance comme : Completed, Partial, Skipped
- **FR-015**: Le système DOIT calculer un score de complétion basé sur les contraintes respectées
- **FR-016**: Le système DOIT maintenir un compteur de streak par routine

#### Tâches
- **FR-020**: Les utilisateurs DOIVENT pouvoir créer des tâches avec : titre, domaine, priorité, durée estimée
- **FR-021**: Les tâches DOIVENT pouvoir être associées à un projet (optionnel)
- **FR-022**: Les tâches DOIVENT supporter les statuts : BACKLOG, TODO, IN_PROGRESS, BLOCKED, DONE, CANCELLED
- **FR-023**: Les utilisateurs DOIVENT pouvoir définir une date d'échéance avec option "deadline stricte"
- **FR-024**: Le système DOIT enregistrer le temps réel passé sur chaque tâche

#### Projets
- **FR-030**: Les utilisateurs DOIVENT pouvoir créer des projets avec : nom, domaine, description, dates début/fin
- **FR-031**: Les projets DOIVENT agréger automatiquement les métriques de leurs tâches (progression, temps)
- **FR-032**: Les projets DOIVENT supporter les statuts : Actif, En pause, Terminé, Archivé

#### Planning & IA
- **FR-040**: Le système DOIT générer un planning quotidien en utilisant l'IA
- **FR-041**: L'IA DOIT placer les routines à créneau fixe en priorité (non déplaçables)
- **FR-042**: L'IA DOIT placer les routines flexibles dans les créneaux optimaux disponibles
- **FR-043**: L'IA DOIT placer les tâches par ordre de priorité dans les créneaux restants
- **FR-044**: Chaque slot du planning DOIT inclure un raisonnement IA expliquant le choix
- **FR-045**: Le système DOIT permettre la régénération du planning

#### Visualisation
- **FR-050**: Le système DOIT afficher une vue timeline verticale du planning journalier
- **FR-051**: Les slots DOIVENT être colorés selon le domaine de l'élément planifié
- **FR-052**: Les utilisateurs DOIVENT pouvoir naviguer entre les jours
- **FR-053**: Le système DOIT afficher un indicateur de l'heure actuelle sur la timeline

#### Analytics
- **FR-060**: Le système DOIT calculer et afficher le taux de complétion des routines (semaine/mois)
- **FR-061**: Le système DOIT afficher les streaks actuels de toutes les routines
- **FR-062**: Le système DOIT afficher la répartition du temps par domaine (prévu vs réalisé)

---

### Key Entities

- **Domain (Domaine)**: Catégorie de vie de l'utilisateur. Contient : nom, icône, couleur, vision, budget temps. Tous les autres éléments sont rattachés à un domaine.

- **RoutineTemplate (Modèle de Routine)**: Définition d'une habitude récurrente. Contient : nom, domaine, catégories, contraintes (durée, créneau, valeur cible avec flags "requis"), récurrence, priorité, flexibilité.

- **RoutineInstance (Instance de Routine)**: Occurrence spécifique d'une routine pour une date donnée. Contient : date, heures planifiées/réelles, valeur atteinte, statut, score, humeur, énergie, notes.

- **Task (Tâche)**: Action ponctuelle à réaliser. Contient : titre, domaine, projet optionnel, priorité, statut, estimations/durées, deadline.

- **Project (Projet)**: Conteneur de tâches vers un objectif. Contient : nom, domaine, description, dates, statut.

- **GeneratedPlan (Planning Généré)**: Planning d'une journée. Contient : date, statut, paramètres de génération.

- **PlanSlot (Créneau du Planning)**: Un bloc de temps dans le planning. Contient : heures début/fin, type (routine/tâche/pause), référence à l'élément, raisonnement IA, statut d'exécution.

- **RoutineInstanceTask (Lien Routine-Tâche)**: Association entre une instance de routine et les tâches travaillées pendant. Contient : références, temps passé, notes.

- **Streak**: Compteur de jours consécutifs pour une routine. Contient : streak actuel, record, dernière date complétée.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les utilisateurs peuvent configurer leurs domaines et routines en moins de 15 minutes lors du premier usage
- **SC-002**: La génération d'un planning quotidien prend moins de 10 secondes
- **SC-003**: Les utilisateurs consultent leur planning au moins une fois par jour (mesure d'engagement)
- **SC-004**: Le taux de complétion des routines trackées atteint 70% en moyenne après 2 semaines d'utilisation
- **SC-005**: 90% des plannings générés ne contiennent aucun conflit non résolu
- **SC-006**: Les utilisateurs peuvent marquer une routine comme faite en moins de 3 clics/taps
- **SC-007**: Le système supporte la création de 50+ routines et 500+ tâches par utilisateur sans dégradation perceptible
- **SC-008**: 80% des utilisateurs actifs maintiennent au moins un streak de 7+ jours après un mois d'utilisation

---

## Assumptions

- L'utilisateur a accès au module LifeOS (via le système d'accès module existant)
- L'API OpenAI est utilisée pour la génération de planning et les raisonnements IA
- Les préférences horaires utilisateur (heure réveil/coucher) sont des valeurs fixes pour V1
- La synchronisation Google Calendar est hors scope V1 (les événements ne sont pas importés)
- Le système fonctionne en timezone unique (celle de l'utilisateur) pour V1
- Les notifications/rappels sont hors scope V1
- L'interface est responsive mais optimisée desktop-first pour V1

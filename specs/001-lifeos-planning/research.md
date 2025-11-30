# Research: LifeOS Planning V1

**Feature**: 001-lifeos-planning  
**Date**: 2025-11-30  
**Status**: Complete

---

## 1. Recurrence Pattern Storage

### Decision: RRULE String + JSON Metadata

**Rationale**: Le standard iCalendar RRULE est universellement reconnu et permet une interopérabilité future avec Google Calendar. Stockage en deux parties :
- `recurrence_rule` (TEXT) — RRULE string pour les calculs
- `recurrence_config` (JSONB) — Metadata UI-friendly pour l'affichage

**Alternatives considérées**:
- JSON seul : Plus flexible mais nécessite parsing custom
- Colonnes séparées (days[], interval, etc.) : Trop rigide, difficile à étendre

**Implementation**:
```sql
-- Exemple RRULE
-- Quotidien: FREQ=DAILY
-- Jours spécifiques: FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
-- Mensuel: FREQ=MONTHLY;BYMONTHDAY=1,15

-- Config JSON pour UI
{
  "type": "weekly",
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "exceptions": []
}
```

**Library**: Utiliser `rrule` npm package pour parsing/génération des occurrences.

---

## 2. Routine Constraints Modeling

### Decision: JSONB avec Structure Typée

**Rationale**: Les contraintes sont flexibles (chaque flag required/optional indépendant). JSONB permet l'évolution sans migrations.

**Structure**:
```typescript
interface RoutineConstraints {
  duration: {
    required: boolean;
    minutes: number;
  } | null;
  timeSlot: {
    required: boolean;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
  } | null;
  targetValue: {
    required: boolean;
    value: number;
    unit: string;
  } | null;
}
```

**Alternatives considérées**:
- Colonnes séparées : Trop de colonnes nullable, difficile à maintenir
- Table de contraintes séparée : Over-engineering pour ce cas d'usage

---

## 3. Completion Score Calculation

### Decision: Algorithme Pondéré Côté Serveur

**Rationale**: Le score doit être calculé de manière cohérente et stocké pour analytics.

**Algorithme**:
```typescript
function calculateCompletionScore(
  template: RoutineTemplate,
  instance: RoutineInstance
): number {
  const constraints = template.constraints;
  let totalWeight = 0;
  let earnedWeight = 0;

  // Duration (si requis)
  if (constraints.duration?.required) {
    totalWeight += 40;
    const actualMinutes = calculateMinutesDiff(instance.actual_start, instance.actual_end);
    const targetMinutes = constraints.duration.minutes;
    const ratio = Math.min(actualMinutes / targetMinutes, 1.2); // Cap à 120%
    earnedWeight += Math.round(40 * Math.min(ratio, 1));
  }

  // Time Slot (si requis)
  if (constraints.timeSlot?.required) {
    totalWeight += 30;
    const startDiff = Math.abs(timeDiff(constraints.timeSlot.startTime, instance.actual_start));
    // Tolérance: 15 min = 100%, 30 min = 50%, >45 min = 0%
    if (startDiff <= 15) earnedWeight += 30;
    else if (startDiff <= 30) earnedWeight += 15;
  }

  // Target Value (si requis)
  if (constraints.targetValue?.required && instance.actual_value !== null) {
    totalWeight += 30;
    const ratio = instance.actual_value / constraints.targetValue.value;
    earnedWeight += Math.round(30 * Math.min(ratio, 1));
  }

  // Si aucune contrainte requise, le fait d'avoir fait = 100%
  if (totalWeight === 0) return 100;

  return Math.round((earnedWeight / totalWeight) * 100);
}
```

---

## 4. Streak Calculation Strategy

### Decision: Colonne Matérialisée + Trigger/RPC Update

**Rationale**: Les streaks sont lus fréquemment (UI) mais mis à jour rarement (1x/jour). Matérialiser évite le calcul à chaque lecture.

**Implementation**:
```sql
-- Table streaks (ou colonnes dans routine_templates)
CREATE TABLE lifeos_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_template_id UUID NOT NULL REFERENCES lifeos_routine_templates(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(routine_template_id)
);

-- RPC pour mise à jour atomique
CREATE OR REPLACE FUNCTION lifeos_update_streak(
  p_routine_template_id UUID,
  p_completed_date DATE
) RETURNS lifeos_streaks AS $$
DECLARE
  v_streak lifeos_streaks;
BEGIN
  SELECT * INTO v_streak FROM lifeos_streaks WHERE routine_template_id = p_routine_template_id;
  
  IF v_streak.last_completed_date IS NULL OR 
     p_completed_date - v_streak.last_completed_date > 1 THEN
    -- Reset streak
    v_streak.current_streak := 1;
  ELSIF p_completed_date - v_streak.last_completed_date = 1 THEN
    -- Increment streak
    v_streak.current_streak := v_streak.current_streak + 1;
  END IF;
  -- Si même jour, pas de changement
  
  v_streak.longest_streak := GREATEST(v_streak.longest_streak, v_streak.current_streak);
  v_streak.last_completed_date := p_completed_date;
  v_streak.updated_at := now();
  
  UPDATE lifeos_streaks SET 
    current_streak = v_streak.current_streak,
    longest_streak = v_streak.longest_streak,
    last_completed_date = v_streak.last_completed_date,
    updated_at = v_streak.updated_at
  WHERE routine_template_id = p_routine_template_id;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. AI Scheduling Architecture

### Decision: Structured Output + JSON Schema

**Rationale**: OpenAI Structured Outputs garantit un format valide. Le prompt inclut toutes les contraintes et l'IA retourne un planning structuré.

**Model**: `gpt-4o-mini` (coût optimisé, suffisant pour cette tâche)

**Input Schema**:
```typescript
interface SchedulingInput {
  date: string; // ISO date
  wakeTime: string; // "HH:mm"
  sleepTime: string; // "HH:mm"
  routines: Array<{
    id: string;
    name: string;
    domain: string;
    constraints: RoutineConstraints;
    isFlexible: boolean;
    priority: 'high' | 'medium' | 'low';
  }>;
  tasks: Array<{
    id: string;
    title: string;
    domain: string;
    priority: 'high' | 'medium' | 'low';
    estimatedMinutes: number;
    deadline: string | null;
    isDeadlineStrict: boolean;
  }>;
  existingEvents: Array<{
    title: string;
    startTime: string;
    endTime: string;
    isBlocking: boolean;
  }>;
}
```

**Output Schema (Structured Output)**:
```typescript
interface SchedulingOutput {
  slots: Array<{
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    type: 'routine' | 'task' | 'break' | 'buffer';
    entityId: string | null;
    reasoning: string; // Explication pour l'utilisateur
  }>;
  unplacedItems: Array<{
    entityId: string;
    entityType: 'routine' | 'task';
    reason: string;
  }>;
  optimizationScore: number; // 0-100
}
```

**Prompt Strategy**:
1. System prompt définit le rôle (personal scheduler)
2. User prompt contient l'input JSON
3. Force JSON output via `response_format: { type: "json_schema", json_schema: {...} }`

---

## 6. Domain Default Seeds

### Decision: 8 Domaines Prédéfinis

**Rationale**: Basé sur les frameworks de développement personnel (Wheel of Life, Life Areas).

**Seeds**:
```typescript
const DEFAULT_DOMAINS = [
  { name: "Spiritualité", icon: "🙏", color: "#8B5CF6" },      // violet-500
  { name: "Santé & Bien-être", icon: "💪", color: "#10B981" }, // emerald-500
  { name: "Carrière & Business", icon: "🚀", color: "#3B82F6" }, // blue-500
  { name: "Développement Personnel", icon: "🧠", color: "#06B6D4" }, // cyan-500
  { name: "Relations & Social", icon: "❤️", color: "#EC4899" }, // pink-500
  { name: "Loisirs & Détente", icon: "🎮", color: "#F97316" }, // orange-500
  { name: "Finance & Patrimoine", icon: "💰", color: "#EAB308" }, // yellow-500
  { name: "Environnement & Cadre de vie", icon: "🏠", color: "#78716C" }, // stone-500
];
```

**Trigger**: Création automatique via trigger `AFTER INSERT ON profiles` ou via Server Action au premier accès.

---

## 7. Task Status State Machine

### Decision: Enum avec Transitions Validées

**Statuts**:
```
BACKLOG → TODO → IN_PROGRESS → DONE
                      ↓
                   BLOCKED
                      ↓
            (back to IN_PROGRESS)
                      
Any → CANCELLED
DONE → ARCHIVED (soft delete)
```

**Transitions valides**:
| From | To | Condition |
|------|-----|-----------|
| BACKLOG | TODO | User action |
| TODO | IN_PROGRESS | User starts task |
| IN_PROGRESS | DONE | User completes |
| IN_PROGRESS | BLOCKED | User reports blocker |
| BLOCKED | IN_PROGRESS | Blocker resolved |
| * | CANCELLED | User cancels |
| DONE | ARCHIVED | User archives |

**Implementation**: Validation dans le service, pas de contrainte SQL (flexibilité).

---

## 8. Routine Instance Generation

### Decision: À la Demande (Lazy Generation)

**Rationale**: Générer toutes les instances futures serait wasteful. Générer quand :
1. L'utilisateur demande un planning pour une date
2. L'utilisateur accède à une date dans le futur (max J+7)

**Process**:
```typescript
async function ensureRoutineInstances(userId: string, date: Date): Promise<void> {
  // 1. Get all active routine templates
  const templates = await getActiveRoutineTemplates(userId);
  
  // 2. For each template, check if instance exists for date
  for (const template of templates) {
    const exists = await instanceExistsForDate(template.id, date);
    if (!exists && isScheduledForDate(template.recurrence, date)) {
      await createRoutineInstance(template, date);
    }
  }
}
```

---

## 9. Timeline UI Component

### Decision: CSS Grid + Virtualization si Nécessaire

**Rationale**: Une journée = ~18 heures (6h-24h) = 36 slots de 30min. Pas besoin de virtualisation pour cette échelle.

**Structure**:
```tsx
// Timeline: grille horaire fixe
// Slots: positionnés en absolute sur la grille

<div className="relative h-full">
  {/* Hour markers */}
  {hours.map(hour => (
    <div key={hour} className="h-16 border-t border-border">
      <span className="text-xs text-muted">{hour}:00</span>
    </div>
  ))}
  
  {/* Slots positioned absolutely */}
  {slots.map(slot => (
    <PlanSlot 
      key={slot.id}
      slot={slot}
      style={{
        top: calculateTop(slot.startTime),
        height: calculateHeight(slot.duration),
      }}
    />
  ))}
  
  {/* Current time indicator */}
  <div 
    className="absolute w-full h-0.5 bg-accent"
    style={{ top: calculateTop(currentTime) }}
  />
</div>
```

**Libraries**: Pas de dépendance externe pour le calendrier (trop opinionated). Custom implementation avec Shadcn.

---

## 10. Module Access Control

### Decision: Réutiliser `user_module_access` Existant

**Rationale**: Le système de modules est déjà en place. Ajouter `lifeos` à la liste.

**Implementation**:
1. Ajouter `'lifeos'` dans `MODULE_SLUGS` constant
2. Middleware check via `useModuleAccess('lifeos')`
3. Admin peut grant/revoke via panel existant

---

## Summary of Key Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Recurrence | RRULE + JSON | Standard iCal, extensible |
| Constraints | JSONB typed | Flexible, évolutif |
| Score | Server-side weighted | Cohérent, analytics-ready |
| Streaks | Materialized + RPC | Read-heavy optimization |
| AI Model | gpt-4o-mini | Cost-effective for scheduling |
| AI Output | Structured JSON | Guaranteed valid format |
| Domain Seeds | 8 defaults | Life Areas framework |
| Task Status | Enum state machine | Clear transitions |
| Instances | Lazy generation | Efficient, on-demand |
| Timeline | CSS Grid custom | Full control, no bloat |
| Module Access | Existing system | Reuse infrastructure |

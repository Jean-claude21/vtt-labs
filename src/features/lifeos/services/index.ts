/**
 * LifeOS Services - Barrel Export
 * 
 * @module lifeos/services
 */

// Shared types - export only once
export type { ServiceResult } from './calendar.service';

// Calendar (aggregation)
export { calendarService } from './calendar.service';

// Dependencies (Gantt)
export { dependenciesService } from './dependencies.service';

// Domains
export { domainService } from './domains.service';

// Media (Tracking)
export { mediaService } from './media.service';

// Planning (Legacy timeline)
export { planningService } from './planning.service';

// Preferences
export { preferencesService } from './preferences.service';

// Routine Instances
export { routineInstanceService } from './routine-instances.service';

// Routines (Templates)
export { routineService } from './routines.service';

// Streaks
export { streakService } from './streaks.service';

// Tasks
export { taskService } from './tasks.service';

// Timer
export { timerService } from './timer.service';

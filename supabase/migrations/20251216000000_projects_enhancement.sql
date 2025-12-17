-- ============================================================================
-- LifeOS Projects Enhancement - Additional Fields for Gantt View
-- Feature: 001-lifeos-planning
-- Date: 2025-12-16
-- ============================================================================

-- NOTE: lifeos_task_dependencies table already created in 20251206000000_lifeos_planning_v2.sql
-- This migration only adds missing columns and views

-- ============================================================================
-- 1. ADD MISSING FIELDS TO TASKS FOR GANTT
-- ============================================================================

-- Start date for tasks (different from due_date which is end date)
ALTER TABLE lifeos_tasks 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Color override for Gantt/Kanban visualization
ALTER TABLE lifeos_tasks 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Progress percentage for tasks with subtasks
ALTER TABLE lifeos_tasks 
ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100);

-- ============================================================================
-- 3. ADD COLOR TO PROJECTS
-- ============================================================================

ALTER TABLE lifeos_projects 
ADD COLUMN IF NOT EXISTS color TEXT;

-- ============================================================================
-- 4. VIEW: Projects with calculated progress
-- ============================================================================

CREATE OR REPLACE VIEW lifeos_projects_with_progress AS
SELECT 
    p.id,
    p.user_id,
    p.domain_id,
    p.name,
    p.description,
    p.status,
    p.color,
    p.start_date,
    p.target_date,
    p.created_at,
    p.updated_at,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'blocked') AS blocked_tasks,
    CASE 
        WHEN COUNT(t.id) = 0 THEN 0
        ELSE ROUND((COUNT(t.id) FILTER (WHERE t.status = 'done')::DECIMAL / COUNT(t.id)) * 100)
    END AS progress_percent
FROM lifeos_projects p
LEFT JOIN lifeos_tasks t ON t.project_id = p.id AND t.status != 'cancelled' AND t.status != 'archived'
GROUP BY p.id;

-- ============================================================================
-- 5. VIEW: Tasks with dependencies for Gantt
-- ============================================================================

CREATE OR REPLACE VIEW lifeos_tasks_gantt AS
SELECT 
    t.id,
    t.user_id,
    t.domain_id,
    t.project_id,
    t.parent_task_id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.estimated_minutes,
    t.actual_minutes,
    t.start_date,
    t.due_date,
    t.due_time,
    t.color,
    t.progress_percent,
    t.created_at,
    t.updated_at,
    -- Predecessor IDs as array
    ARRAY_AGG(DISTINCT dep_pred.predecessor_id) FILTER (WHERE dep_pred.predecessor_id IS NOT NULL) AS predecessor_ids,
    -- Successor IDs as array
    ARRAY_AGG(DISTINCT dep_succ.successor_id) FILTER (WHERE dep_succ.successor_id IS NOT NULL) AS successor_ids,
    -- Subtask count
    (SELECT COUNT(*) FROM lifeos_tasks sub WHERE sub.parent_task_id = t.id) AS subtask_count,
    -- Subtasks done count
    (SELECT COUNT(*) FROM lifeos_tasks sub WHERE sub.parent_task_id = t.id AND sub.status = 'done') AS subtasks_done
FROM lifeos_tasks t
LEFT JOIN lifeos_task_dependencies dep_pred ON dep_pred.successor_id = t.id
LEFT JOIN lifeos_task_dependencies dep_succ ON dep_succ.predecessor_id = t.id
GROUP BY t.id;

-- ============================================================================
-- 6. FUNCTION: Auto-update progress based on subtasks
-- ============================================================================

CREATE OR REPLACE FUNCTION lifeos_update_task_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update parent task progress when a subtask changes
    IF NEW.parent_task_id IS NOT NULL THEN
        UPDATE lifeos_tasks
        SET progress_percent = (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE status = 'done')::DECIMAL / COUNT(*)) * 100)
            END
            FROM lifeos_tasks 
            WHERE parent_task_id = NEW.parent_task_id
        ),
        updated_at = now()
        WHERE id = NEW.parent_task_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for subtask progress updates
DROP TRIGGER IF EXISTS trigger_update_task_progress ON lifeos_tasks;
CREATE TRIGGER trigger_update_task_progress
    AFTER INSERT OR UPDATE OF status ON lifeos_tasks
    FOR EACH ROW
    EXECUTE FUNCTION lifeos_update_task_progress();

-- ============================================================================
-- 7. FUNCTION: Auto-complete project when all tasks done
-- ============================================================================

CREATE OR REPLACE FUNCTION lifeos_auto_complete_project()
RETURNS TRIGGER AS $$
DECLARE
    project_total INTEGER;
    project_done INTEGER;
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'done')
        INTO project_total, project_done
        FROM lifeos_tasks
        WHERE project_id = NEW.project_id
        AND status NOT IN ('cancelled', 'archived');
        
        -- If all tasks are done, mark project as completed
        IF project_total > 0 AND project_total = project_done THEN
            UPDATE lifeos_projects
            SET status = 'completed', updated_at = now()
            WHERE id = NEW.project_id AND status = 'active';
        -- If project was completed but a task is now not done, reactivate
        ELSIF NEW.status != 'done' THEN
            UPDATE lifeos_projects
            SET status = 'active', updated_at = now()
            WHERE id = NEW.project_id AND status = 'completed';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-completing projects
DROP TRIGGER IF EXISTS trigger_auto_complete_project ON lifeos_tasks;
CREATE TRIGGER trigger_auto_complete_project
    AFTER INSERT OR UPDATE OF status ON lifeos_tasks
    FOR EACH ROW
    EXECUTE FUNCTION lifeos_auto_complete_project();

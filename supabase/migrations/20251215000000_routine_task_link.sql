-- Migration: Routine-Task Linking
-- Links routine instances to generated tasks for tracking

-- Add routine_instance_id to tasks table
ALTER TABLE lifeos_tasks 
ADD COLUMN IF NOT EXISTS routine_instance_id UUID REFERENCES lifeos_routine_instances(id) ON DELETE SET NULL;

-- Add task_id to routine_instances table for bidirectional reference
ALTER TABLE lifeos_routine_instances
ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES lifeos_tasks(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_routine_instance 
ON lifeos_tasks(routine_instance_id) 
WHERE routine_instance_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routine_instances_linked_task 
ON lifeos_routine_instances(linked_task_id) 
WHERE linked_task_id IS NOT NULL;

-- Function to create a task from a routine instance
CREATE OR REPLACE FUNCTION lifeos_create_task_from_routine(
  p_instance_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance RECORD;
  v_template RECORD;
  v_task_id UUID;
BEGIN
  -- Get instance details
  SELECT * INTO v_instance 
  FROM lifeos_routine_instances 
  WHERE id = p_instance_id AND user_id = p_user_id;
  
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'Instance not found or access denied';
  END IF;
  
  -- Check if task already exists
  IF v_instance.linked_task_id IS NOT NULL THEN
    RETURN v_instance.linked_task_id;
  END IF;
  
  -- Get template details
  SELECT * INTO v_template 
  FROM lifeos_routine_templates 
  WHERE id = v_instance.template_id;
  
  -- Create the task
  INSERT INTO lifeos_tasks (
    user_id,
    title,
    description,
    domain_id,
    status,
    priority,
    scheduled_date,
    scheduled_time,
    estimated_minutes,
    routine_instance_id,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_template.name || ' (' || v_instance.scheduled_date || ')',
    'Tâche générée depuis la routine: ' || v_template.name,
    v_template.domain_id,
    'todo',
    'medium',
    v_instance.scheduled_date,
    v_instance.scheduled_start::TIME,
    COALESCE(
      EXTRACT(EPOCH FROM (v_instance.scheduled_end - v_instance.scheduled_start)) / 60,
      60
    )::INTEGER,
    p_instance_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_task_id;
  
  -- Link back to instance
  UPDATE lifeos_routine_instances 
  SET linked_task_id = v_task_id, updated_at = NOW()
  WHERE id = p_instance_id;
  
  RETURN v_task_id;
END;
$$;

-- Function to sync task status with routine instance
CREATE OR REPLACE FUNCTION lifeos_sync_task_routine_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When task is completed, complete the routine instance
  IF NEW.status IN ('done', 'completed') AND OLD.status NOT IN ('done', 'completed') THEN
    IF NEW.routine_instance_id IS NOT NULL THEN
      UPDATE lifeos_routine_instances
      SET 
        status = 'completed',
        actual_end = COALESCE(NEW.completed_at, NOW()),
        updated_at = NOW()
      WHERE id = NEW.routine_instance_id
        AND status != 'completed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-sync status
DROP TRIGGER IF EXISTS trg_sync_task_routine_status ON lifeos_tasks;
CREATE TRIGGER trg_sync_task_routine_status
  AFTER UPDATE ON lifeos_tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION lifeos_sync_task_routine_status();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION lifeos_create_task_from_routine(UUID, UUID) TO authenticated;

COMMENT ON COLUMN lifeos_tasks.routine_instance_id IS 'Reference to the routine instance that generated this task';
COMMENT ON COLUMN lifeos_routine_instances.linked_task_id IS 'Reference to the task created from this routine instance';
COMMENT ON FUNCTION lifeos_create_task_from_routine IS 'Creates a task from a routine instance for tracking';

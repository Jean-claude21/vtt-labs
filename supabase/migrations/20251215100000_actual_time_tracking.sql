-- ============================================================================
-- LifeOS Actual Time Tracking Migration
-- Feature: Track actual start/end times for tasks (routines already have it)
-- Purpose: Compare scheduled vs actual times for AI stats
-- Date: 2025-12-15
-- ============================================================================

-- Add actual_start and actual_end to lifeos_tasks
-- These track when the user actually started and finished the task
ALTER TABLE lifeos_tasks 
ADD COLUMN IF NOT EXISTS actual_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_lifeos_tasks_actual_times 
ON lifeos_tasks(actual_start, actual_end) 
WHERE actual_start IS NOT NULL;

-- Comment documentation
COMMENT ON COLUMN lifeos_tasks.actual_start IS 'When the user actually started working on this task';
COMMENT ON COLUMN lifeos_tasks.actual_end IS 'When the user actually finished this task';
COMMENT ON COLUMN lifeos_tasks.completed_at IS 'When the task was marked as completed';

-- ============================================================================
-- Function to start a task (record actual_start)
-- ============================================================================
CREATE OR REPLACE FUNCTION lifeos_start_task(p_task_id UUID)
RETURNS lifeos_tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task lifeos_tasks;
BEGIN
  UPDATE lifeos_tasks
  SET 
    actual_start = COALESCE(actual_start, NOW()),
    status = 'in_progress',
    updated_at = NOW()
  WHERE id = p_task_id AND user_id = auth.uid()
  RETURNING * INTO v_task;
  
  IF v_task IS NULL THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;
  
  RETURN v_task;
END;
$$;

-- ============================================================================
-- Function to complete a task (record actual_end)
-- ============================================================================
CREATE OR REPLACE FUNCTION lifeos_complete_task(p_task_id UUID)
RETURNS lifeos_tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task lifeos_tasks;
  v_duration_minutes INTEGER;
BEGIN
  -- First get current task to calculate duration
  SELECT * INTO v_task FROM lifeos_tasks WHERE id = p_task_id AND user_id = auth.uid();
  
  IF v_task IS NULL THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;
  
  -- Calculate actual duration if we have actual_start
  IF v_task.actual_start IS NOT NULL THEN
    v_duration_minutes := EXTRACT(EPOCH FROM (NOW() - v_task.actual_start)) / 60;
  END IF;
  
  UPDATE lifeos_tasks
  SET 
    actual_end = NOW(),
    completed_at = NOW(),
    status = 'done',
    actual_minutes = COALESCE(actual_minutes, 0) + COALESCE(v_duration_minutes, 0),
    updated_at = NOW()
  WHERE id = p_task_id AND user_id = auth.uid()
  RETURNING * INTO v_task;
  
  RETURN v_task;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION lifeos_start_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION lifeos_complete_task(UUID) TO authenticated;

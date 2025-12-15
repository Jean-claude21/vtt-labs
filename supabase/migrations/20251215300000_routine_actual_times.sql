-- ============================================================================
-- LifeOS Routine Actual Time Tracking Migration
-- Feature: Track actual start/end times for routine instances
-- Purpose: Compare scheduled vs actual times for analytics
-- Date: 2025-12-15
-- ============================================================================

-- Add actual_start and actual_end to lifeos_routine_instances
-- These track when the user actually started and finished the routine
ALTER TABLE lifeos_routine_instances 
ADD COLUMN IF NOT EXISTS actual_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end TIMESTAMPTZ;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_lifeos_routine_instances_actual_times 
ON lifeos_routine_instances(actual_start, actual_end) 
WHERE actual_start IS NOT NULL;

-- Comment documentation
COMMENT ON COLUMN lifeos_routine_instances.actual_start IS 'When the user actually started this routine instance';
COMMENT ON COLUMN lifeos_routine_instances.actual_end IS 'When the user actually finished this routine instance';

-- ============================================================================
-- Function to start a routine (record actual_start)
-- ============================================================================
CREATE OR REPLACE FUNCTION lifeos_start_routine(p_instance_id UUID)
RETURNS lifeos_routine_instances
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance lifeos_routine_instances;
BEGIN
  UPDATE lifeos_routine_instances
  SET 
    actual_start = COALESCE(actual_start, NOW()),
    status = 'in_progress',
    updated_at = NOW()
  WHERE id = p_instance_id AND user_id = auth.uid()
  RETURNING * INTO v_instance;
  
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'Routine instance not found or access denied';
  END IF;
  
  RETURN v_instance;
END;
$$;

-- ============================================================================
-- Function to complete a routine (record actual_end)
-- ============================================================================
CREATE OR REPLACE FUNCTION lifeos_complete_routine(
  p_instance_id UUID,
  p_status TEXT DEFAULT 'completed'
)
RETURNS lifeos_routine_instances
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance lifeos_routine_instances;
BEGIN
  UPDATE lifeos_routine_instances
  SET 
    actual_end = COALESCE(actual_end, NOW()),
    status = p_status,
    updated_at = NOW()
  WHERE id = p_instance_id AND user_id = auth.uid()
  RETURNING * INTO v_instance;
  
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'Routine instance not found or access denied';
  END IF;
  
  RETURN v_instance;
END;
$$;

-- ============================================================================
-- Function to update routine actual times manually
-- ============================================================================
CREATE OR REPLACE FUNCTION lifeos_update_routine_actual_times(
  p_instance_id UUID,
  p_actual_start TIMESTAMPTZ DEFAULT NULL,
  p_actual_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS lifeos_routine_instances
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance lifeos_routine_instances;
BEGIN
  UPDATE lifeos_routine_instances
  SET 
    actual_start = COALESCE(p_actual_start, actual_start),
    actual_end = COALESCE(p_actual_end, actual_end),
    updated_at = NOW()
  WHERE id = p_instance_id AND user_id = auth.uid()
  RETURNING * INTO v_instance;
  
  IF v_instance IS NULL THEN
    RAISE EXCEPTION 'Routine instance not found or access denied';
  END IF;
  
  RETURN v_instance;
END;
$$;

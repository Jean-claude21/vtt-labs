-- ============================================================================
-- LifeOS Auto-Position Settings Migration
-- Feature: 001-lifeos-planning (Auto-positioning for routines/tasks)
-- Date: 2025-12-14
-- ============================================================================

-- ============================================================================
-- 1. Add auto_position columns to lifeos_user_preferences
-- ============================================================================

DO $$
BEGIN
  -- Add auto_position_routines if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lifeos_user_preferences' 
    AND column_name = 'auto_position_routines'
  ) THEN
    ALTER TABLE lifeos_user_preferences 
    ADD COLUMN auto_position_routines BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add auto_position_tasks if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lifeos_user_preferences' 
    AND column_name = 'auto_position_tasks'
  ) THEN
    ALTER TABLE lifeos_user_preferences 
    ADD COLUMN auto_position_tasks BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- 2. Add default_start_time and default_duration_minutes to routine templates
-- These allow templates to define preferred time slots
-- ============================================================================

DO $$
BEGIN
  -- Add default_start_time if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lifeos_routine_templates' 
    AND column_name = 'default_start_time'
  ) THEN
    ALTER TABLE lifeos_routine_templates 
    ADD COLUMN default_start_time TIME;
  END IF;

  -- Add default_duration_minutes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lifeos_routine_templates' 
    AND column_name = 'default_duration_minutes'
  ) THEN
    ALTER TABLE lifeos_routine_templates 
    ADD COLUMN default_duration_minutes INTEGER DEFAULT 30 CHECK (default_duration_minutes > 0 AND default_duration_minutes <= 480);
  END IF;
END $$;

-- ============================================================================
-- 3. Update comments for documentation
-- ============================================================================

COMMENT ON COLUMN lifeos_user_preferences.auto_position_routines IS 
'When true, routines are auto-positioned based on constraints.timeSlot or category_moment time blocks';

COMMENT ON COLUMN lifeos_user_preferences.auto_position_tasks IS 
'When true, tasks with scheduled_date are auto-positioned. When false, they stay in "To Plan" sidebar';

COMMENT ON COLUMN lifeos_routine_templates.default_start_time IS 
'Default start time for this routine. Overrides category_moment time block if set.';

COMMENT ON COLUMN lifeos_routine_templates.default_duration_minutes IS 
'Default duration in minutes for this routine. Used when generating instances.';

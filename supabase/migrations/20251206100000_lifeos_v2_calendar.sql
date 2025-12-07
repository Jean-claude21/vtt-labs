-- ============================================================================
-- LifeOS V2 Calendar Enhancement Migration
-- Feature: 001-lifeos-planning (V2 Calendar-Centric)
-- Date: 2025-12-06
-- ============================================================================

-- ============================================================================
-- 1. Add scheduled_date and scheduled_time to lifeos_tasks
-- These fields allow tasks to be placed on the calendar independently of due_date
-- ============================================================================

ALTER TABLE lifeos_tasks 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Index for calendar queries
CREATE INDEX IF NOT EXISTS idx_lifeos_tasks_scheduled_date 
ON lifeos_tasks(scheduled_date) 
WHERE scheduled_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lifeos_tasks_user_scheduled 
ON lifeos_tasks(user_id, scheduled_date) 
WHERE scheduled_date IS NOT NULL;

-- ============================================================================
-- 2. Add time_blocks to lifeos_user_preferences
-- Allows users to define custom time ranges for category moments
-- ============================================================================

-- First check if lifeos_user_preferences exists, if not create it
CREATE TABLE IF NOT EXISTS lifeos_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Calendar preferences
  default_calendar_view TEXT NOT NULL DEFAULT 'week' CHECK (default_calendar_view IN ('day', 'week', 'month')),
  week_starts_on INTEGER NOT NULL DEFAULT 1 CHECK (week_starts_on >= 0 AND week_starts_on <= 6),
  
  -- Display filters
  show_routines BOOLEAN NOT NULL DEFAULT true,
  show_tasks BOOLEAN NOT NULL DEFAULT true,
  show_external_events BOOLEAN NOT NULL DEFAULT true,
  hidden_domain_ids UUID[] DEFAULT '{}',
  
  -- Time blocks for category moments (JSONB)
  -- Format: { "morning": { "start": "06:00", "end": "12:00" }, ... }
  time_blocks JSONB NOT NULL DEFAULT '{
    "morning": { "start": "06:00", "end": "12:00" },
    "noon": { "start": "12:00", "end": "14:00" },
    "afternoon": { "start": "14:00", "end": "18:00" },
    "evening": { "start": "18:00", "end": "21:00" },
    "night": { "start": "21:00", "end": "23:59" }
  }'::jsonb,
  
  -- Routine generation
  routine_generation_horizon_days INTEGER NOT NULL DEFAULT 14 CHECK (routine_generation_horizon_days >= 7 AND routine_generation_horizon_days <= 90),
  
  -- Extensible preferences
  preferences JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If table already exists, just add the time_blocks column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lifeos_user_preferences' 
    AND column_name = 'time_blocks'
  ) THEN
    ALTER TABLE lifeos_user_preferences 
    ADD COLUMN time_blocks JSONB NOT NULL DEFAULT '{
      "morning": { "start": "06:00", "end": "12:00" },
      "noon": { "start": "12:00", "end": "14:00" },
      "afternoon": { "start": "14:00", "end": "18:00" },
      "evening": { "start": "18:00", "end": "21:00" },
      "night": { "start": "21:00", "end": "23:59" }
    }'::jsonb;
  END IF;
END $$;

-- RLS for preferences table
ALTER TABLE lifeos_user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON lifeos_user_preferences;
CREATE POLICY "Users can view own preferences" ON lifeos_user_preferences
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own preferences" ON lifeos_user_preferences;
CREATE POLICY "Users can insert own preferences" ON lifeos_user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own preferences" ON lifeos_user_preferences;
CREATE POLICY "Users can update own preferences" ON lifeos_user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- 3. Add constraint fields to routine templates for exact_time and time_range
-- The constraints JSONB already supports this, but let's document the structure
-- ============================================================================

COMMENT ON COLUMN lifeos_routine_templates.constraints IS 
'JSONB structure for routine constraints:
{
  "duration": { "required": boolean, "minutes": number },
  "time_slot": { "required": boolean, "startTime": "HH:mm", "endTime": "HH:mm" },
  "exact_time": { "time": "HH:mm" },
  "time_range": { "earliest": "HH:mm", "latest": "HH:mm", "preferred": "HH:mm" },
  "target_value": { "required": boolean, "target": number, "unit": string }
}';

-- ============================================================================
-- 4. Add scheduled_start and scheduled_end to routine instances if missing
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lifeos_routine_instances' 
    AND column_name = 'scheduled_start'
  ) THEN
    ALTER TABLE lifeos_routine_instances 
    ADD COLUMN scheduled_start TIME,
    ADD COLUMN scheduled_end TIME;
  END IF;
END $$;

-- ============================================================================
-- 5. Create function to get or create user preferences
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS lifeos_user_preferences AS $$
DECLARE
  v_prefs lifeos_user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_prefs FROM lifeos_user_preferences WHERE user_id = p_user_id;
  
  -- If not found, create default preferences
  IF v_prefs IS NULL THEN
    INSERT INTO lifeos_user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;
  
  RETURN v_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Update trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lifeos_user_preferences_updated_at ON lifeos_user_preferences;
CREATE TRIGGER lifeos_user_preferences_updated_at
  BEFORE UPDATE ON lifeos_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

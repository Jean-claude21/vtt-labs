-- ============================================================================
-- LifeOS Planning V2 - Calendar-Centric Migration
-- Date: 2025-12-06
-- Description: Adds timer, media, dependencies, preferences for V2 MVP
-- ============================================================================

-- ============================================================================
-- 1. TIMER COLUMNS FOR TASKS
-- ============================================================================

ALTER TABLE lifeos_tasks 
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS timer_accumulated_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timer_is_running BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. DYNAMIC FLAG FOR ROUTINE-TASK LINKING
-- ============================================================================

ALTER TABLE lifeos_routine_instance_tasks 
ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT false;

-- ============================================================================
-- 3. TRACKING MEDIA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_tracking_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Polymorphic reference (extensible for future modules)
  entity_type TEXT NOT NULL,  -- 'routine_instance', 'task', etc.
  entity_id UUID NOT NULL,
  
  -- File information
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- MIME type
  file_size INTEGER,
  
  -- Categorization
  media_category TEXT CHECK (media_category IN ('photo', 'video', 'audio', 'document', 'other')),
  
  -- Metadata
  caption TEXT,
  thumbnail_path TEXT,
  duration_seconds INTEGER,  -- For audio/video
  metadata JSONB DEFAULT '{}',  -- Extensible
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for media
CREATE INDEX IF NOT EXISTS idx_lifeos_tracking_media_user 
  ON lifeos_tracking_media(user_id);
CREATE INDEX IF NOT EXISTS idx_lifeos_tracking_media_entity 
  ON lifeos_tracking_media(entity_type, entity_id);

-- RLS for media
ALTER TABLE lifeos_tracking_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own media" ON lifeos_tracking_media;
CREATE POLICY "Users can view own media" ON lifeos_tracking_media
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own media" ON lifeos_tracking_media;
CREATE POLICY "Users can insert own media" ON lifeos_tracking_media
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own media" ON lifeos_tracking_media;
CREATE POLICY "Users can update own media" ON lifeos_tracking_media
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own media" ON lifeos_tracking_media;
CREATE POLICY "Users can delete own media" ON lifeos_tracking_media
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 4. TASK DEPENDENCIES TABLE (FOR GANTT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES lifeos_tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES lifeos_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' 
    CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(predecessor_id, successor_id),
  CHECK (predecessor_id != successor_id)
);

-- Indexes for dependencies
CREATE INDEX IF NOT EXISTS idx_lifeos_task_deps_predecessor 
  ON lifeos_task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_lifeos_task_deps_successor 
  ON lifeos_task_dependencies(successor_id);

-- RLS for dependencies (check via task ownership)
ALTER TABLE lifeos_task_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own task dependencies" ON lifeos_task_dependencies;
CREATE POLICY "Users can view own task dependencies" ON lifeos_task_dependencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lifeos_tasks t 
      WHERE t.id = predecessor_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own task dependencies" ON lifeos_task_dependencies;
CREATE POLICY "Users can insert own task dependencies" ON lifeos_task_dependencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lifeos_tasks t 
      WHERE t.id = predecessor_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own task dependencies" ON lifeos_task_dependencies;
CREATE POLICY "Users can update own task dependencies" ON lifeos_task_dependencies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lifeos_tasks t 
      WHERE t.id = predecessor_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own task dependencies" ON lifeos_task_dependencies;
CREATE POLICY "Users can delete own task dependencies" ON lifeos_task_dependencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lifeos_tasks t 
      WHERE t.id = predecessor_id AND t.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. USER PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Calendar preferences
  default_calendar_view TEXT DEFAULT 'week' 
    CHECK (default_calendar_view IN ('day', 'week', 'month')),
  week_starts_on INTEGER DEFAULT 1 
    CHECK (week_starts_on BETWEEN 0 AND 6),  -- 0=Sunday, 1=Monday
  
  -- Display filters (persisted)
  show_routines BOOLEAN DEFAULT true,
  show_tasks BOOLEAN DEFAULT true,
  show_external_events BOOLEAN DEFAULT true,
  hidden_domain_ids UUID[] DEFAULT '{}',
  
  -- Planning settings
  routine_generation_horizon_days INTEGER DEFAULT 14,
  
  -- Extensible preferences
  preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for preferences
CREATE INDEX IF NOT EXISTS idx_lifeos_user_preferences_user 
  ON lifeos_user_preferences(user_id);

-- RLS for preferences
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

DROP POLICY IF EXISTS "Users can delete own preferences" ON lifeos_user_preferences;
CREATE POLICY "Users can delete own preferences" ON lifeos_user_preferences
  FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_lifeos_user_preferences_updated_at ON lifeos_user_preferences;
CREATE TRIGGER update_lifeos_user_preferences_updated_at
  BEFORE UPDATE ON lifeos_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. HELPER FUNCTION: GET OR CREATE USER PREFERENCES
-- ============================================================================

CREATE OR REPLACE FUNCTION lifeos_get_or_create_preferences(p_user_id UUID)
RETURNS lifeos_user_preferences
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_prefs lifeos_user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_prefs 
  FROM lifeos_user_preferences 
  WHERE user_id = p_user_id;
  
  -- If not found, create with defaults
  IF v_prefs IS NULL THEN
    INSERT INTO lifeos_user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;
  
  RETURN v_prefs;
END;
$$;

-- ============================================================================
-- 7. HELPER FUNCTION: GET CALENDAR EVENTS FOR DATE RANGE
-- ============================================================================

CREATE OR REPLACE FUNCTION lifeos_get_calendar_events(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_show_routines BOOLEAN DEFAULT true,
  p_show_tasks BOOLEAN DEFAULT true,
  p_hidden_domain_ids UUID[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'routineInstances', CASE WHEN p_show_routines THEN (
      SELECT COALESCE(json_agg(ri_data), '[]'::json)
      FROM (
        SELECT 
          ri.id,
          ri.template_id,
          ri.scheduled_date,
          ri.scheduled_start,
          ri.scheduled_end,
          ri.status,
          ri.completion_score,
          rt.name as title,
          rt.category_moment,
          rt.category_type,
          rt.is_flexible,
          rt.priority,
          d.id as domain_id,
          d.name as domain_name,
          d.color as domain_color,
          d.icon as domain_icon
        FROM lifeos_routine_instances ri
        JOIN lifeos_routine_templates rt ON ri.template_id = rt.id
        LEFT JOIN lifeos_domains d ON rt.domain_id = d.id
        WHERE ri.user_id = p_user_id
          AND ri.scheduled_date BETWEEN p_start_date AND p_end_date
          AND (rt.domain_id IS NULL OR NOT (rt.domain_id = ANY(p_hidden_domain_ids)))
        ORDER BY ri.scheduled_date, ri.scheduled_start
      ) ri_data
    ) ELSE '[]'::json END,
    
    'tasks', CASE WHEN p_show_tasks THEN (
      SELECT COALESCE(json_agg(t_data), '[]'::json)
      FROM (
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date,
          t.due_time,
          t.estimated_minutes,
          t.actual_minutes,
          t.timer_is_running,
          t.timer_accumulated_seconds,
          t.project_id,
          p.name as project_name,
          d.id as domain_id,
          d.name as domain_name,
          d.color as domain_color,
          d.icon as domain_icon
        FROM lifeos_tasks t
        LEFT JOIN lifeos_domains d ON t.domain_id = d.id
        LEFT JOIN lifeos_projects p ON t.project_id = p.id
        WHERE t.user_id = p_user_id
          AND t.due_date BETWEEN p_start_date AND p_end_date
          AND t.status NOT IN ('done', 'cancelled', 'archived')
          AND (t.domain_id IS NULL OR NOT (t.domain_id = ANY(p_hidden_domain_ids)))
        ORDER BY t.due_date, t.due_time, t.priority DESC
      ) t_data
    ) ELSE '[]'::json END,
    
    'dateRange', json_build_object(
      'start', p_start_date,
      'end', p_end_date
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 8. STORAGE BUCKET FOR MEDIA (Run manually in Supabase Dashboard if needed)
-- ============================================================================

-- Note: Storage bucket creation via SQL may not work in all Supabase setups.
-- If this fails, create the bucket manually in the Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create bucket: "lifeos-media"
-- 3. Set to Private
-- 4. Add RLS policy for authenticated users

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'lifeos-media', 
--   'lifeos-media', 
--   false,
--   52428800,  -- 50MB limit
--   ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf']::text[]
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

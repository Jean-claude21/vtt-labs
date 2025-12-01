-- ============================================================================
-- LifeOS Planning V1 - Database Migration
-- Feature: 001-lifeos-planning
-- Date: 2025-11-30
-- ============================================================================

-- ============================================================================
-- 1. LIFEOS_DOMAINS - Life categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📌',
  color TEXT NOT NULL DEFAULT '#6B7280',
  vision TEXT,
  daily_target_minutes INTEGER,
  weekly_target_minutes INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifeos_domains_user_id ON lifeos_domains(user_id);
CREATE INDEX idx_lifeos_domains_user_sort ON lifeos_domains(user_id, sort_order);

ALTER TABLE lifeos_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own domains" ON lifeos_domains
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own domains" ON lifeos_domains
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own domains" ON lifeos_domains
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own domains" ON lifeos_domains
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 2. LIFEOS_PROJECTS - Task containers
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES lifeos_domains(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifeos_projects_user_id ON lifeos_projects(user_id);
CREATE INDEX idx_lifeos_projects_user_status ON lifeos_projects(user_id, status);
CREATE INDEX idx_lifeos_projects_domain_id ON lifeos_projects(domain_id);

ALTER TABLE lifeos_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON lifeos_projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects" ON lifeos_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON lifeos_projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON lifeos_projects
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 3. LIFEOS_TASKS - One-time actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES lifeos_domains(id) ON DELETE SET NULL,
  project_id UUID REFERENCES lifeos_projects(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES lifeos_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'blocked', 'done', 'cancelled', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  estimated_minutes INTEGER,
  actual_minutes INTEGER DEFAULT 0,
  due_date DATE,
  due_time TIME,
  is_deadline_strict BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifeos_tasks_user_id ON lifeos_tasks(user_id);
CREATE INDEX idx_lifeos_tasks_user_status ON lifeos_tasks(user_id, status);
CREATE INDEX idx_lifeos_tasks_user_priority ON lifeos_tasks(user_id, priority);
CREATE INDEX idx_lifeos_tasks_domain_id ON lifeos_tasks(domain_id);
CREATE INDEX idx_lifeos_tasks_project_id ON lifeos_tasks(project_id);
CREATE INDEX idx_lifeos_tasks_due_date ON lifeos_tasks(due_date);
CREATE INDEX idx_lifeos_tasks_parent ON lifeos_tasks(parent_task_id);

ALTER TABLE lifeos_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON lifeos_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tasks" ON lifeos_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks" ON lifeos_tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks" ON lifeos_tasks
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 4. LIFEOS_ROUTINE_TEMPLATES - Recurring habit definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES lifeos_domains(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_moment TEXT CHECK (category_moment IN ('morning', 'noon', 'afternoon', 'evening', 'night')),
  category_type TEXT CHECK (category_type IN ('professional', 'personal', 'spiritual', 'health', 'learning', 'leisure', 'energy')),
  constraints JSONB NOT NULL DEFAULT '{}',
  recurrence_rule TEXT NOT NULL,
  recurrence_config JSONB NOT NULL DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_flexible BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifeos_routine_templates_user_id ON lifeos_routine_templates(user_id);
CREATE INDEX idx_lifeos_routine_templates_user_active ON lifeos_routine_templates(user_id, is_active);
CREATE INDEX idx_lifeos_routine_templates_domain_id ON lifeos_routine_templates(domain_id);

ALTER TABLE lifeos_routine_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own routine templates" ON lifeos_routine_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own routine templates" ON lifeos_routine_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own routine templates" ON lifeos_routine_templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own routine templates" ON lifeos_routine_templates
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 5. LIFEOS_ROUTINE_INSTANCES - Specific occurrences
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_routine_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES lifeos_routine_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_start TIME,
  scheduled_end TIME,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  actual_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'partial', 'skipped')),
  skip_reason TEXT,
  completion_score INTEGER CHECK (completion_score >= 0 AND completion_score <= 100),
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, scheduled_date)
);

CREATE INDEX idx_lifeos_routine_instances_user_id ON lifeos_routine_instances(user_id);
CREATE INDEX idx_lifeos_routine_instances_template_id ON lifeos_routine_instances(template_id);
CREATE INDEX idx_lifeos_routine_instances_user_date ON lifeos_routine_instances(user_id, scheduled_date);
CREATE INDEX idx_lifeos_routine_instances_date_status ON lifeos_routine_instances(scheduled_date, status);

ALTER TABLE lifeos_routine_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own routine instances" ON lifeos_routine_instances
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own routine instances" ON lifeos_routine_instances
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own routine instances" ON lifeos_routine_instances
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own routine instances" ON lifeos_routine_instances
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 6. LIFEOS_ROUTINE_INSTANCE_TASKS - Tasks worked during a routine
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_routine_instance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_instance_id UUID NOT NULL REFERENCES lifeos_routine_instances(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES lifeos_tasks(id) ON DELETE CASCADE,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(routine_instance_id, task_id)
);

CREATE INDEX idx_lifeos_routine_instance_tasks_instance ON lifeos_routine_instance_tasks(routine_instance_id);
CREATE INDEX idx_lifeos_routine_instance_tasks_task ON lifeos_routine_instance_tasks(task_id);

ALTER TABLE lifeos_routine_instance_tasks ENABLE ROW LEVEL SECURITY;

-- For this table, we need to check ownership via the parent routine_instance
CREATE POLICY "Users can view own routine instance tasks" ON lifeos_routine_instance_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lifeos_routine_instances ri 
      WHERE ri.id = routine_instance_id AND ri.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own routine instance tasks" ON lifeos_routine_instance_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lifeos_routine_instances ri 
      WHERE ri.id = routine_instance_id AND ri.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own routine instance tasks" ON lifeos_routine_instance_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lifeos_routine_instances ri 
      WHERE ri.id = routine_instance_id AND ri.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own routine instance tasks" ON lifeos_routine_instance_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lifeos_routine_instances ri 
      WHERE ri.id = routine_instance_id AND ri.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. LIFEOS_STREAKS - Streak counters per routine
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_template_id UUID NOT NULL UNIQUE REFERENCES lifeos_routine_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifeos_streaks_user_id ON lifeos_streaks(user_id);
CREATE INDEX idx_lifeos_streaks_template ON lifeos_streaks(routine_template_id);

ALTER TABLE lifeos_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks" ON lifeos_streaks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streaks" ON lifeos_streaks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streaks" ON lifeos_streaks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own streaks" ON lifeos_streaks
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 8. LIFEOS_GENERATED_PLANS - AI-generated daily plans
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_generated_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  generation_params JSONB,
  ai_model TEXT,
  optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_lifeos_generated_plans_user_id ON lifeos_generated_plans(user_id);
CREATE INDEX idx_lifeos_generated_plans_user_date ON lifeos_generated_plans(user_id, date);

ALTER TABLE lifeos_generated_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON lifeos_generated_plans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own plans" ON lifeos_generated_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plans" ON lifeos_generated_plans
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own plans" ON lifeos_generated_plans
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- 9. LIFEOS_PLAN_SLOTS - Time blocks in a plan
-- ============================================================================

CREATE TABLE IF NOT EXISTS lifeos_plan_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES lifeos_generated_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('routine', 'task', 'break', 'buffer', 'event')),
  entity_type TEXT CHECK (entity_type IN ('routine_instance', 'task')),
  entity_id UUID,
  ai_reasoning TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  was_executed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifeos_plan_slots_plan_id ON lifeos_plan_slots(plan_id);
CREATE INDEX idx_lifeos_plan_slots_user_id ON lifeos_plan_slots(user_id);
CREATE INDEX idx_lifeos_plan_slots_plan_sort ON lifeos_plan_slots(plan_id, sort_order);

ALTER TABLE lifeos_plan_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan slots" ON lifeos_plan_slots
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own plan slots" ON lifeos_plan_slots
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plan slots" ON lifeos_plan_slots
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own plan slots" ON lifeos_plan_slots
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function: Update streak after routine completion
CREATE OR REPLACE FUNCTION lifeos_update_streak(
  p_routine_template_id UUID,
  p_completed_date DATE
) RETURNS lifeos_streaks
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_streak lifeos_streaks;
  v_user_id UUID;
  v_last_date DATE;
  v_expected_date DATE;
  v_new_current INTEGER;
  v_new_longest INTEGER;
BEGIN
  -- Get user_id from routine template
  SELECT user_id INTO v_user_id 
  FROM lifeos_routine_templates 
  WHERE id = p_routine_template_id;

  -- Get or create streak record
  SELECT * INTO v_streak 
  FROM lifeos_streaks 
  WHERE routine_template_id = p_routine_template_id;

  IF v_streak IS NULL THEN
    -- Create new streak
    INSERT INTO lifeos_streaks (routine_template_id, user_id, current_streak, longest_streak, last_completed_date)
    VALUES (p_routine_template_id, v_user_id, 1, 1, p_completed_date)
    RETURNING * INTO v_streak;
    RETURN v_streak;
  END IF;

  -- Calculate expected date based on recurrence (simplified: assuming daily)
  v_last_date := v_streak.last_completed_date;
  v_expected_date := v_last_date + INTERVAL '1 day';

  IF p_completed_date = v_expected_date THEN
    -- Consecutive day - increment streak
    v_new_current := v_streak.current_streak + 1;
    v_new_longest := GREATEST(v_streak.longest_streak, v_new_current);
  ELSIF p_completed_date > v_expected_date THEN
    -- Streak broken - reset
    v_new_current := 1;
    v_new_longest := v_streak.longest_streak;
  ELSE
    -- Same day or past (already counted) - no change
    RETURN v_streak;
  END IF;

  -- Update streak
  UPDATE lifeos_streaks
  SET 
    current_streak = v_new_current,
    longest_streak = v_new_longest,
    last_completed_date = p_completed_date,
    updated_at = now()
  WHERE id = v_streak.id
  RETURNING * INTO v_streak;

  RETURN v_streak;
END;
$$;

-- Function: Seed default domains for a new user
CREATE OR REPLACE FUNCTION lifeos_seed_default_domains(p_user_id UUID)
RETURNS SETOF lifeos_domains
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if user already has domains
  IF EXISTS (SELECT 1 FROM lifeos_domains WHERE user_id = p_user_id) THEN
    RETURN QUERY SELECT * FROM lifeos_domains WHERE user_id = p_user_id ORDER BY sort_order;
    RETURN;
  END IF;

  -- Insert default domains
  RETURN QUERY
  INSERT INTO lifeos_domains (user_id, name, icon, color, vision, sort_order, is_default)
  VALUES
    (p_user_id, 'Spiritualité', '🙏', '#8B5CF6', 'Cultiver ma connexion spirituelle et ma paix intérieure', 0, true),
    (p_user_id, 'Santé & Bien-être', '💪', '#10B981', 'Maintenir une santé optimale et un bien-être durable', 1, true),
    (p_user_id, 'Carrière & Business', '💼', '#F59E0B', 'Développer ma carrière et atteindre mes objectifs professionnels', 2, true),
    (p_user_id, 'Développement Personnel', '📚', '#3B82F6', 'Apprendre constamment et développer mes compétences', 3, true),
    (p_user_id, 'Relations & Social', '👥', '#EC4899', 'Cultiver des relations authentiques et significatives', 4, true),
    (p_user_id, 'Loisirs & Détente', '🎮', '#14B8A6', 'Prendre du temps pour me détendre et me ressourcer', 5, true),
    (p_user_id, 'Finance & Patrimoine', '💰', '#EAB308', 'Construire ma sécurité financière et mon patrimoine', 6, true),
    (p_user_id, 'Environnement & Cadre de vie', '🏠', '#6366F1', 'Créer un environnement propice à mon épanouissement', 7, true)
  RETURNING *;
END;
$$;

-- Function: Get daily analytics
CREATE OR REPLACE FUNCTION lifeos_get_daily_analytics(
  p_user_id UUID,
  p_date DATE
) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'date', p_date,
    'total_routines', (
      SELECT COUNT(*) 
      FROM lifeos_routine_instances 
      WHERE user_id = p_user_id AND scheduled_date = p_date
    ),
    'completed_routines', (
      SELECT COUNT(*) 
      FROM lifeos_routine_instances 
      WHERE user_id = p_user_id AND scheduled_date = p_date AND status IN ('completed', 'partial')
    ),
    'skipped_routines', (
      SELECT COUNT(*) 
      FROM lifeos_routine_instances 
      WHERE user_id = p_user_id AND scheduled_date = p_date AND status = 'skipped'
    ),
    'completion_rate', (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE status IN ('completed', 'partial'))::DECIMAL / 
           NULLIF(COUNT(*), 0)) * 100
        ), 0
      )
      FROM lifeos_routine_instances 
      WHERE user_id = p_user_id AND scheduled_date = p_date
    ),
    'avg_completion_score', (
      SELECT COALESCE(AVG(completion_score), 0)
      FROM lifeos_routine_instances 
      WHERE user_id = p_user_id AND scheduled_date = p_date AND completion_score IS NOT NULL
    ),
    'total_tasks_completed', (
      SELECT COUNT(*) 
      FROM lifeos_tasks 
      WHERE user_id = p_user_id AND status = 'done' AND updated_at::DATE = p_date
    ),
    'time_by_domain', (
      SELECT COALESCE(json_agg(domain_time), '[]'::json)
      FROM (
        SELECT 
          d.id as domain_id,
          d.name as domain_name,
          d.color as domain_color,
          COALESCE(SUM(
            EXTRACT(EPOCH FROM (ri.actual_end - ri.actual_start)) / 60
          ), 0)::INTEGER as actual_minutes,
          COALESCE(SUM(
            EXTRACT(EPOCH FROM (ri.scheduled_end::TIME - ri.scheduled_start::TIME)) / 60
          ), 0)::INTEGER as planned_minutes
        FROM lifeos_domains d
        LEFT JOIN lifeos_routine_templates rt ON rt.domain_id = d.id
        LEFT JOIN lifeos_routine_instances ri ON ri.template_id = rt.id 
          AND ri.scheduled_date = p_date 
          AND ri.status IN ('completed', 'partial')
        WHERE d.user_id = p_user_id
        GROUP BY d.id, d.name, d.color
        ORDER BY d.sort_order
      ) domain_time
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lifeos_domains_updated_at
  BEFORE UPDATE ON lifeos_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifeos_projects_updated_at
  BEFORE UPDATE ON lifeos_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifeos_tasks_updated_at
  BEFORE UPDATE ON lifeos_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifeos_routine_templates_updated_at
  BEFORE UPDATE ON lifeos_routine_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifeos_routine_instances_updated_at
  BEFORE UPDATE ON lifeos_routine_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifeos_generated_plans_updated_at
  BEFORE UPDATE ON lifeos_generated_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

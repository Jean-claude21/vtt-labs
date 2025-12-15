-- ============================================================================
-- LifeOS Demo Data Seeding Function
-- ============================================================================
-- This function seeds demo data for a user when they first access LifeOS.
-- It creates domains, routine templates, and sample tasks.
-- ============================================================================

-- Function to seed all demo data for a user
CREATE OR REPLACE FUNCTION lifeos_seed_demo_data(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_domain_spirituality UUID;
  v_domain_health UUID;
  v_domain_career UUID;
  v_domain_learning UUID;
  v_domain_relations UUID;
  v_domain_leisure UUID;
  v_domain_finance UUID;
  v_domain_environment UUID;
  v_project_id UUID;
BEGIN
  -- Check if user already has data (domains exist = already seeded)
  IF EXISTS (SELECT 1 FROM lifeos_domains WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN FALSE; -- Already seeded
  END IF;

  -- ========================================================================
  -- 1. SEED DOMAINS
  -- ========================================================================
  INSERT INTO lifeos_domains (user_id, name, icon, color, vision, sort_order, is_default)
  VALUES
    (p_user_id, 'Spiritualité', '🙏', '#8B5CF6', 'Cultiver ma connexion spirituelle et ma paix intérieure', 0, true),
    (p_user_id, 'Santé & Bien-être', '💪', '#10B981', 'Maintenir une santé optimale et un bien-être durable', 1, true),
    (p_user_id, 'Carrière & Business', '💼', '#F59E0B', 'Développer ma carrière et atteindre mes objectifs professionnels', 2, true),
    (p_user_id, 'Développement Personnel', '📚', '#3B82F6', 'Apprendre constamment et développer mes compétences', 3, true),
    (p_user_id, 'Relations & Social', '👥', '#EC4899', 'Cultiver des relations authentiques et significatives', 4, true),
    (p_user_id, 'Loisirs & Détente', '🎮', '#14B8A6', 'Prendre du temps pour me détendre et me ressourcer', 5, true),
    (p_user_id, 'Finance & Patrimoine', '💰', '#EAB308', 'Construire ma sécurité financière et mon patrimoine', 6, true),
    (p_user_id, 'Environnement & Cadre de vie', '🏠', '#6366F1', 'Créer un environnement propice à mon épanouissement', 7, true);

  -- Get domain IDs
  SELECT id INTO v_domain_spirituality FROM lifeos_domains WHERE user_id = p_user_id AND name = 'Spiritualité';
  SELECT id INTO v_domain_health FROM lifeos_domains WHERE user_id = p_user_id AND name = 'Santé & Bien-être';
  SELECT id INTO v_domain_career FROM lifeos_domains WHERE user_id = p_user_id AND name = 'Carrière & Business';
  SELECT id INTO v_domain_learning FROM lifeos_domains WHERE user_id = p_user_id AND name = 'Développement Personnel';
  SELECT id INTO v_domain_relations FROM lifeos_domains WHERE user_id = p_user_id AND name = 'Relations & Social';
  SELECT id INTO v_domain_leisure FROM lifeos_domains WHERE user_id = p_user_id AND name = 'Loisirs & Détente';
  SELECT id INTO v_domain_finance FROM lifeos_domains WHERE user_id = p_user_id AND name = 'Finance & Patrimoine';
  SELECT id INTO v_domain_environment FROM lifeos_domains WHERE user_id = p_user_id AND name = 'Environnement & Cadre de vie';

  -- ========================================================================
  -- 2. SEED ROUTINE TEMPLATES
  -- ========================================================================
  INSERT INTO lifeos_routine_templates (user_id, domain_id, name, description, category_moment, category_type, recurrence_rule, recurrence_config, priority, is_flexible, is_active, constraints, checklist_items)
  VALUES
    -- Morning routines
    (p_user_id, v_domain_spirituality, 'Méditation matinale', 'Prendre 15 minutes pour méditer et centrer mon esprit', 'morning', 'spiritual', 'daily', '{"days": [1,2,3,4,5,6,7]}', 'high', false, true, '{"duration_minutes": 15, "time_of_day": "06:30"}',
     '[{"id": "med-1", "label": "Préparer espace", "order": 1}, {"id": "med-2", "label": "Respiration 3min", "order": 2}, {"id": "med-3", "label": "Méditation 10min", "order": 3}]'::jsonb),
    (p_user_id, v_domain_health, 'Exercice physique', 'Session de sport ou yoga pour bien démarrer la journée', 'morning', 'health', 'daily', '{"days": [1,2,3,4,5,6,7]}', 'high', true, true, '{"duration_minutes": 45, "time_of_day": "07:00"}',
     '[{"id": "exo-1", "label": "Échauffement", "order": 1}, {"id": "exo-2", "label": "Cardio/Muscu 30min", "order": 2}, {"id": "exo-3", "label": "Étirements", "order": 3}, {"id": "exo-4", "label": "Douche froide", "order": 4}]'::jsonb),
    (p_user_id, v_domain_learning, 'Lecture développement', 'Lire 20 pages d''un livre de développement personnel', 'morning', 'learning', 'daily', '{"days": [1,2,3,4,5]}', 'medium', true, true, '{"duration_minutes": 30, "time_of_day": "08:00"}', NULL),
    
    -- Afternoon routines
    (p_user_id, v_domain_career, 'Deep Work Session', 'Session de travail concentré sur les tâches importantes', 'afternoon', 'professional', 'weekdays', '{"days": [1,2,3,4,5]}', 'high', false, true, '{"duration_minutes": 90, "time_of_day": "14:00"}',
     '[{"id": "dw-1", "label": "Mode avion", "order": 1}, {"id": "dw-2", "label": "3 priorités", "order": 2}, {"id": "dw-3", "label": "Focus 45min", "order": 3}, {"id": "dw-4", "label": "Pause 5min", "order": 4}, {"id": "dw-5", "label": "Focus 40min", "order": 5}]'::jsonb),
    
    -- Evening routines
    (p_user_id, v_domain_relations, 'Temps famille/amis', 'Moment de qualité avec les proches', 'evening', 'personal', 'daily', '{"days": [1,2,3,4,5,6,7]}', 'high', true, true, '{"duration_minutes": 60, "time_of_day": "19:00"}', NULL),
    (p_user_id, v_domain_spirituality, 'Gratitude journal', 'Écrire 3 choses pour lesquelles je suis reconnaissant', 'night', 'spiritual', 'daily', '{"days": [1,2,3,4,5,6,7]}', 'medium', false, true, '{"duration_minutes": 10, "time_of_day": "21:30"}',
     '[{"id": "grat-1", "label": "3 gratitudes", "order": 1}, {"id": "grat-2", "label": "1 réussite", "order": 2}, {"id": "grat-3", "label": "Intention demain", "order": 3}]'::jsonb),
    (p_user_id, v_domain_health, 'Routine sommeil', 'Préparer le corps et l''esprit pour un sommeil réparateur', 'night', 'health', 'daily', '{"days": [1,2,3,4,5,6,7]}', 'high', false, true, '{"duration_minutes": 30, "time_of_day": "22:00"}',
     '[{"id": "sleep-1", "label": "Éteindre écrans", "order": 1}, {"id": "sleep-2", "label": "Préparer affaires", "order": 2}, {"id": "sleep-3", "label": "Skincare", "order": 3}, {"id": "sleep-4", "label": "Lecture 10min", "order": 4}]'::jsonb),
    
    -- Weekly routines
    (p_user_id, v_domain_environment, 'Revue hebdomadaire', 'Faire le point sur la semaine et planifier la suivante', 'afternoon', 'personal', 'weekly', '{"days": [7]}', 'high', false, true, '{"duration_minutes": 60, "time_of_day": "16:00"}',
     '[{"id": "rev-1", "label": "Revoir objectifs", "order": 1}, {"id": "rev-2", "label": "Célébrer victoires", "order": 2}, {"id": "rev-3", "label": "Identifier blocages", "order": 3}, {"id": "rev-4", "label": "Planifier semaine", "order": 4}]'::jsonb),
    (p_user_id, v_domain_finance, 'Check finances', 'Vérifier les comptes et le budget', 'morning', 'personal', 'weekly', '{"days": [7]}', 'medium', true, true, '{"duration_minutes": 30, "time_of_day": "10:00"}', NULL);

  -- ========================================================================
  -- 3. SEED SAMPLE PROJECT
  -- ========================================================================
  INSERT INTO lifeos_projects (user_id, domain_id, name, description, status)
  VALUES (p_user_id, v_domain_career, 'Projet LifeOS', 'Développer et améliorer le système LifeOS', 'active')
  RETURNING id INTO v_project_id;

  -- ========================================================================
  -- 4. SEED SAMPLE TASKS
  -- ========================================================================
  INSERT INTO lifeos_tasks (user_id, domain_id, project_id, title, description, status, priority, due_date, estimated_minutes)
  VALUES
    -- Tasks liées au projet
    (p_user_id, v_domain_career, v_project_id, 'Configurer les domaines de vie', 'Définir et personnaliser les 8 domaines de vie', 'done', 'high', CURRENT_DATE - INTERVAL '2 days', 30),
    (p_user_id, v_domain_career, v_project_id, 'Créer les premières routines', 'Définir les routines matinales et du soir', 'done', 'high', CURRENT_DATE - INTERVAL '1 day', 45),
    (p_user_id, v_domain_career, v_project_id, 'Tester le calendrier', 'Vérifier l''affichage des événements', 'todo', 'medium', CURRENT_DATE, 20),
    (p_user_id, v_domain_career, v_project_id, 'Configurer les statistiques', 'Personnaliser le tableau de bord', 'todo', 'low', CURRENT_DATE + INTERVAL '2 days', 30),
    
    -- Tasks personnelles
    (p_user_id, v_domain_health, NULL, 'Prendre RDV médecin', 'Bilan de santé annuel', 'todo', 'medium', CURRENT_DATE + INTERVAL '7 days', 15),
    (p_user_id, v_domain_finance, NULL, 'Réviser le budget mensuel', 'Analyser les dépenses du mois', 'todo', 'medium', CURRENT_DATE + INTERVAL '3 days', 60),
    (p_user_id, v_domain_learning, NULL, 'Finir le livre en cours', 'Terminer "Atomic Habits"', 'in_progress', 'low', CURRENT_DATE + INTERVAL '14 days', 120),
    (p_user_id, v_domain_relations, NULL, 'Organiser dîner entre amis', 'Planifier une soirée pour le week-end', 'todo', 'medium', CURRENT_DATE + INTERVAL '5 days', 30),
    (p_user_id, v_domain_environment, NULL, 'Ranger le bureau', 'Organiser l''espace de travail', 'todo', 'low', CURRENT_DATE + INTERVAL '1 day', 45);

  -- ========================================================================
  -- 5. SEED USER PREFERENCES
  -- ========================================================================
  INSERT INTO lifeos_user_preferences (
    user_id, 
    default_calendar_view, 
    week_starts_on, 
    show_routines, 
    show_tasks, 
    show_external_events,
    routine_generation_horizon_days,
    preferences
  )
  VALUES (
    p_user_id, 
    'week', 
    1, -- Monday
    true,
    true,
    true,
    14,
    '{
      "time_zone": "Europe/Paris",
      "time_blocks": [
        {"name": "Matin productif", "start": "06:00", "end": "09:00", "color": "#FCD34D", "categories": ["spiritual", "health"]},
        {"name": "Travail focus", "start": "09:00", "end": "12:00", "color": "#60A5FA", "categories": ["professional"]},
        {"name": "Pause déjeuner", "start": "12:00", "end": "14:00", "color": "#34D399", "categories": ["health", "personal"]},
        {"name": "Après-midi productif", "start": "14:00", "end": "18:00", "color": "#818CF8", "categories": ["professional", "learning"]},
        {"name": "Temps personnel", "start": "18:00", "end": "21:00", "color": "#F472B6", "categories": ["personal", "leisure"]},
        {"name": "Soirée", "start": "21:00", "end": "23:00", "color": "#A78BFA", "categories": ["spiritual", "health"]}
      ]
    }'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- COMMENT
-- ============================================================================
COMMENT ON FUNCTION lifeos_seed_demo_data IS 'Seeds demo data (domains, routines, tasks, preferences) for a new LifeOS user';

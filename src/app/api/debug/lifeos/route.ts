/**
 * Debug API for LifeOS data
 * GET /api/debug/lifeos
 */

import { createSSRClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get all routine templates
  const { data: templates, error: templatesError } = await supabase
    .from('lifeos_routine_templates')
    .select('id, name, is_active, recurrence_config, recurrence_rule, created_at')
    .eq('user_id', user.id);

  // Get all tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('lifeos_tasks')
    .select('id, title, status, priority, due_date')
    .eq('user_id', user.id);

  // Get today's routine instances
  const today = new Date().toISOString().split('T')[0];
  const { data: instances, error: instancesError } = await supabase
    .from('lifeos_routine_instances')
    .select('*')
    .eq('user_id', user.id)
    .eq('scheduled_date', today);

  // Get today's plan
  const { data: plan, error: planError } = await supabase
    .from('lifeos_generated_plans')
    .select('*, slots:lifeos_plan_slots(*)')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  return NextResponse.json({
    user_id: user.id,
    today,
    templates: {
      count: templates?.length ?? 0,
      data: templates,
      error: templatesError?.message,
    },
    tasks: {
      count: tasks?.length ?? 0,
      data: tasks,
      error: tasksError?.message,
    },
    todayInstances: {
      count: instances?.length ?? 0,
      data: instances,
      error: instancesError?.message,
    },
    todayPlan: {
      exists: !!plan,
      data: plan,
      error: planError?.message,
    },
  });
}

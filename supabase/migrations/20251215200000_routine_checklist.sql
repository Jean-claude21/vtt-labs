-- ============================================================================
-- Migration: Add checklist items to routine templates
-- Description: Allows routines to have sub-tasks/steps that can be checked off
-- ============================================================================

-- Add checklist_items to routine templates
-- Format: [{ "id": "uuid", "label": "Step name", "order": 1 }, ...]
ALTER TABLE lifeos_routine_templates
ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb;

-- Add completed_checklist_items to routine instances
-- Format: ["uuid1", "uuid2"] - list of completed item IDs
ALTER TABLE lifeos_routine_instances
ADD COLUMN IF NOT EXISTS completed_checklist_items JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN lifeos_routine_templates.checklist_items IS 'Array of checklist items: [{ id, label, order }]';
COMMENT ON COLUMN lifeos_routine_instances.completed_checklist_items IS 'Array of completed checklist item IDs';

-- Create index for querying routines with checklists
CREATE INDEX IF NOT EXISTS idx_routine_templates_has_checklist 
ON lifeos_routine_templates ((jsonb_array_length(checklist_items) > 0));

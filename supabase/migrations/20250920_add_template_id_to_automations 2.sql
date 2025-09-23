-- Add template_id field to automations table
-- Date: 2025-01-20

-- Add template_id column to automations table
ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_automations_template_id ON automations(template_id);

-- Add comment for documentation
COMMENT ON COLUMN automations.template_id IS 'Optional reference to the specific template this automation applies to';

-- Create field_mappings table to store custom field to pass field mappings
CREATE TABLE IF NOT EXISTS field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_id UUID NOT NULL, -- References pass_templates.id
  pass_field_id VARCHAR(255) NOT NULL, -- The pass field identifier from the template
  pass_field_key VARCHAR(255) NOT NULL, -- The key used in the pass template
  pass_field_label VARCHAR(255) NOT NULL, -- Human readable label for the pass field
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  transform_type VARCHAR(50) DEFAULT 'direct' CHECK (transform_type IN ('direct', 'format', 'conditional')),
  format_pattern TEXT, -- Optional formatting pattern (e.g., for dates, currency)
  conditional_rules JSONB DEFAULT '{}'::jsonb, -- Rules for conditional mappings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate mappings per pass field
  UNIQUE(business_id, template_id, pass_field_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_field_mappings_business_id ON field_mappings(business_id);
CREATE INDEX IF NOT EXISTS idx_field_mappings_template_id ON field_mappings(template_id);
CREATE INDEX IF NOT EXISTS idx_field_mappings_custom_field_id ON field_mappings(custom_field_id);
CREATE INDEX IF NOT EXISTS idx_field_mappings_active ON field_mappings(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_field_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_field_mappings_updated_at ON field_mappings;
CREATE TRIGGER trigger_field_mappings_updated_at
  BEFORE UPDATE ON field_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_field_mappings_updated_at();

-- Enable RLS on field_mappings table
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view field mappings for their business" ON field_mappings;
DROP POLICY IF EXISTS "Users can insert field mappings for their business" ON field_mappings;
DROP POLICY IF EXISTS "Users can update field mappings for their business" ON field_mappings;
DROP POLICY IF EXISTS "Users can delete field mappings for their business" ON field_mappings;

-- Create RLS policies for field_mappings
CREATE POLICY "Users can view field mappings for their business" ON field_mappings
  FOR SELECT USING (
    business_id IN (
      SELECT business_id 
      FROM business_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert field mappings for their business" ON field_mappings
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id 
      FROM business_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update field mappings for their business" ON field_mappings
  FOR UPDATE USING (
    business_id IN (
      SELECT business_id 
      FROM business_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete field mappings for their business" ON field_mappings
  FOR DELETE USING (
    business_id IN (
      SELECT business_id 
      FROM business_users 
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT ALL ON field_mappings TO authenticated;

-- Create a view for easier querying of mapped fields with custom field details
CREATE OR REPLACE VIEW v_field_mappings_with_details AS
SELECT 
  fm.*,
  cf.field_key as custom_field_key,
  cf.field_label as custom_field_label,
  cf.field_type as custom_field_type,
  cf.applies_to as custom_field_applies_to,
  cf.is_required as custom_field_required
FROM field_mappings fm
JOIN custom_fields cf ON fm.custom_field_id = cf.id
WHERE fm.is_active = true;

-- Grant permissions on the view
GRANT SELECT ON v_field_mappings_with_details TO authenticated;

-- Function to get resolved field value for pass generation
CREATE OR REPLACE FUNCTION get_mapped_field_value(
  p_business_id UUID,
  p_template_id UUID,
  p_pass_field_key VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_mapping RECORD;
  v_field_value TEXT;
BEGIN
  -- Find the mapping for this pass field
  SELECT fm.*, cf.field_key
  INTO v_mapping
  FROM field_mappings fm
  JOIN custom_fields cf ON fm.custom_field_id = cf.id
  WHERE fm.business_id = p_business_id
    AND fm.template_id = p_template_id
    AND fm.pass_field_key = p_pass_field_key
    AND fm.is_active = true
    AND cf.applies_to = p_entity_type;

  -- If no mapping found, return null
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get the actual field value
  SELECT field_value
  INTO v_field_value
  FROM custom_field_values
  WHERE custom_field_id = v_mapping.custom_field_id
    AND entity_id = p_entity_id;

  -- Apply transformations based on transform_type
  CASE v_mapping.transform_type
    WHEN 'format' THEN
      -- Apply format pattern if specified
      IF v_mapping.format_pattern IS NOT NULL THEN
        -- Simple formatting (can be enhanced)
        RETURN COALESCE(v_field_value, '');
      ELSE
        RETURN COALESCE(v_field_value, '');
      END IF;
    WHEN 'conditional' THEN
      -- Apply conditional rules (can be enhanced based on JSON rules)
      RETURN COALESCE(v_field_value, '');
    ELSE -- 'direct'
      RETURN COALESCE(v_field_value, '');
  END CASE;
END;
$$ LANGUAGE plpgsql;


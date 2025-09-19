-- Create custom_fields table for business custom field definitions
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  field_key VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'boolean', 'textarea', 'email', 'phone')),
  field_options JSONB DEFAULT '[]'::jsonb,
  applies_to VARCHAR(50) NOT NULL CHECK (applies_to IN ('customer', 'member', 'pass')),
  is_required BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT false,
  help_text TEXT,
  placeholder_text VARCHAR(255),
  default_value TEXT,
  min_length INTEGER,
  max_length INTEGER,
  min_value NUMERIC,
  max_value NUMERIC,
  validation_regex TEXT,
  pass_field_mapping JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate field keys per business and applies_to
  UNIQUE(business_id, field_key, applies_to)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_business_id ON custom_fields(business_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_applies_to ON custom_fields(applies_to);
CREATE INDEX IF NOT EXISTS idx_custom_fields_sort_order ON custom_fields(sort_order);
CREATE INDEX IF NOT EXISTS idx_custom_fields_is_visible ON custom_fields(is_visible);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_custom_fields_updated_at ON custom_fields;
CREATE TRIGGER trigger_custom_fields_updated_at
  BEFORE UPDATE ON custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_fields_updated_at();

-- Create custom_field_values table to store actual field values
CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('customer', 'member', 'pass')),
  entity_id UUID NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate values per field and entity
  UNIQUE(custom_field_id, entity_id)
);

-- Add indexes for custom_field_values
CREATE INDEX IF NOT EXISTS idx_custom_field_values_custom_field_id ON custom_field_values(custom_field_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field_value ON custom_field_values(field_value);

-- Add updated_at trigger for custom_field_values
CREATE OR REPLACE FUNCTION update_custom_field_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_custom_field_values_updated_at ON custom_field_values;
CREATE TRIGGER trigger_custom_field_values_updated_at
  BEFORE UPDATE ON custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_field_values_updated_at();

-- Enable RLS on custom_fields table
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view custom fields for their business" ON custom_fields;
DROP POLICY IF EXISTS "Users can insert custom fields for their business" ON custom_fields;
DROP POLICY IF EXISTS "Users can update custom fields for their business" ON custom_fields;
DROP POLICY IF EXISTS "Users can delete custom fields for their business" ON custom_fields;

-- Create RLS policies for custom_fields
CREATE POLICY "Users can view custom fields for their business" ON custom_fields
  FOR SELECT USING (
    business_id IN (
      SELECT business_id 
      FROM business_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert custom fields for their business" ON custom_fields
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id 
      FROM business_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update custom fields for their business" ON custom_fields
  FOR UPDATE USING (
    business_id IN (
      SELECT business_id 
      FROM business_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete custom fields for their business" ON custom_fields
  FOR DELETE USING (
    business_id IN (
      SELECT business_id 
      FROM business_users 
      WHERE user_id = auth.uid()
    )
  );

-- Enable RLS on custom_field_values table
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view custom field values for their business" ON custom_field_values;
DROP POLICY IF EXISTS "Users can insert custom field values for their business" ON custom_field_values;
DROP POLICY IF EXISTS "Users can update custom field values for their business" ON custom_field_values;
DROP POLICY IF EXISTS "Users can delete custom field values for their business" ON custom_field_values;

-- Create RLS policies for custom_field_values
CREATE POLICY "Users can view custom field values for their business" ON custom_field_values
  FOR SELECT USING (
    custom_field_id IN (
      SELECT cf.id 
      FROM custom_fields cf
      JOIN business_users bu ON cf.business_id = bu.business_id
      WHERE bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert custom field values for their business" ON custom_field_values
  FOR INSERT WITH CHECK (
    custom_field_id IN (
      SELECT cf.id 
      FROM custom_fields cf
      JOIN business_users bu ON cf.business_id = bu.business_id
      WHERE bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update custom field values for their business" ON custom_field_values
  FOR UPDATE USING (
    custom_field_id IN (
      SELECT cf.id 
      FROM custom_fields cf
      JOIN business_users bu ON cf.business_id = bu.business_id
      WHERE bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete custom field values for their business" ON custom_field_values
  FOR DELETE USING (
    custom_field_id IN (
      SELECT cf.id 
      FROM custom_fields cf
      JOIN business_users bu ON cf.business_id = bu.business_id
      WHERE bu.user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT ALL ON custom_fields TO authenticated;
GRANT ALL ON custom_field_values TO authenticated;

-- Insert some sample custom fields for testing (optional)
-- This will only work if a business with this ID exists
/*
INSERT INTO custom_fields (business_id, field_key, field_label, field_type, applies_to, is_required) VALUES
  ('be023bdf-c668-4cec-ac51-65d3c02ea191', 'membership_tier', 'Membership Tier', 'select', 'customer', true),
  ('be023bdf-c668-4cec-ac51-65d3c02ea191', 'phone_number', 'Phone Number', 'phone', 'customer', false),
  ('be023bdf-c668-4cec-ac51-65d3c02ea191', 'date_of_birth', 'Date of Birth', 'date', 'customer', false),
  ('be023bdf-c668-4cec-ac51-65d3c02ea191', 'favorite_store', 'Favorite Store Location', 'text', 'member', false),
  ('be023bdf-c668-4cec-ac51-65d3c02ea191', 'points_balance', 'Current Points Balance', 'number', 'pass', false);
*/

-- Create Automations System for WalletPush
-- Date: 2025-01-19

-- 1. Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_user(business_id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE, -- Optional: specific to a template
    event_type TEXT NOT NULL CHECK (event_type IN (
        'pass.created',
        'pass.updated', 
        'pass.downloaded',
        'registration.created',
        'registration.deleted',
        'scan.performed',
        'custom_field_updated'
    )),
    webhook_url TEXT, -- Optional: external webhook endpoint
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create automations table
CREATE TABLE IF NOT EXISTS automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_user(business_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused')),
    
    -- Trigger Configuration
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'pass.created',
        'pass.updated', 
        'pass.downloaded',
        'registration.created',
        'registration.deleted',
        'scan.performed',
        'custom_field_updated',
        'webhook'
    )),
    trigger_config JSONB DEFAULT '{}', -- Additional trigger configuration
    
    -- Conditions (optional)
    conditions JSONB DEFAULT '[]', -- Array of condition objects
    
    -- Actions
    actions JSONB NOT NULL DEFAULT '[]', -- Array of action objects
    
    -- Analytics
    total_enrolled INTEGER DEFAULT 0,
    active_enrolled INTEGER DEFAULT 0,
    total_executions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_executed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create automation_executions table (for tracking/analytics)
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    customer_id UUID, -- The customer/member this execution was for
    trigger_data JSONB, -- The data that triggered this execution
    execution_status TEXT NOT NULL CHECK (execution_status IN ('pending', 'running', 'completed', 'failed')),
    actions_executed JSONB DEFAULT '[]', -- Track which actions were executed
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_business_id ON webhook_events(business_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_template_id ON webhook_events(template_id);

CREATE INDEX IF NOT EXISTS idx_automations_business_id ON automations(business_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger_type ON automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);

CREATE INDEX IF NOT EXISTS idx_automation_executions_automation_id ON automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_customer_id ON automation_executions(customer_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(execution_status);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Webhook Events Policies
CREATE POLICY "Users can view their business webhook events" ON webhook_events
    FOR SELECT USING (
        business_id = auth_business_id()
    );

CREATE POLICY "Users can manage their business webhook events" ON webhook_events
    FOR ALL USING (
        business_id = auth_business_id()
    );

-- Automations Policies  
CREATE POLICY "Users can view their business automations" ON automations
    FOR SELECT USING (
        business_id = auth_business_id()
    );

CREATE POLICY "Users can manage their business automations" ON automations
    FOR ALL USING (
        business_id = auth_business_id()
    );

-- Automation Executions Policies
CREATE POLICY "Users can view their business automation executions" ON automation_executions
    FOR SELECT USING (
        automation_id IN (
            SELECT id FROM automations WHERE business_id = auth_business_id()
        )
    );

CREATE POLICY "Users can manage their business automation executions" ON automation_executions
    FOR ALL USING (
        automation_id IN (
            SELECT id FROM automations WHERE business_id = auth_business_id()
        )
    );

-- 7. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
CREATE TRIGGER update_webhook_events_updated_at 
    BEFORE UPDATE ON webhook_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at 
    BEFORE UPDATE ON automations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE webhook_events IS 'Stores webhook event configurations for external integrations';
COMMENT ON TABLE automations IS 'Stores automation workflows with triggers, conditions, and actions';
COMMENT ON TABLE automation_executions IS 'Tracks individual automation executions for analytics and debugging';




-- Create action_requests table for member action approval queue
CREATE TABLE action_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL CHECK (type IN ('check_in', 'earn_points', 'redeem_offer', 'spend_value', 'ticket_use', 'receipt_credit', 'adjust')),
  payload JSONB NOT NULL DEFAULT '{}',
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'auto_approved', 'approved', 'declined', 'cancelled', 'expired')),
  source VARCHAR(20) NOT NULL DEFAULT 'member_dashboard' CHECK (source IN ('member_dashboard', 'present_to_staff', 'kiosk', 'staff_scanner')),
  
  policy_applied JSONB DEFAULT '{}',
  risk_score NUMERIC DEFAULT 0,
  
  reviewer_user_id UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  resulting_event_id UUID REFERENCES customer_events(id),
  
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(business_id, idempotency_key)
);

-- Indexes for performance
CREATE INDEX idx_action_requests_business_status ON action_requests(business_id, status, created_at);
CREATE INDEX idx_action_requests_customer ON action_requests(customer_id, created_at);
CREATE INDEX idx_action_requests_program ON action_requests(program_id, created_at);
CREATE GIN INDEX idx_action_requests_payload ON action_requests USING gin(payload);

-- Add member actions configuration to program versions
ALTER TABLE program_versions 
ADD COLUMN IF NOT EXISTS actions_config JSONB DEFAULT '{}';

-- Add RLS policies
ALTER TABLE action_requests ENABLE ROW LEVEL SECURITY;

-- Business owners/admins can see all requests for their business
CREATE POLICY "Business members can view action requests" ON action_requests
  FOR SELECT USING (
    business_id IN (
      SELECT b.id FROM businesses b
      JOIN account_members am ON am.account_id = b.account_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Business owners/admins can update requests (approve/decline)
CREATE POLICY "Business members can update action requests" ON action_requests
  FOR UPDATE USING (
    business_id IN (
      SELECT b.id FROM businesses b
      JOIN account_members am ON am.account_id = b.account_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Customers can create requests for their own actions
CREATE POLICY "Customers can create action requests" ON action_requests
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Customers can view their own requests
CREATE POLICY "Customers can view own action requests" ON action_requests
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers 
      WHERE email = auth.jwt() ->> 'email'
    )
  );


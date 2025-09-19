-- Enhance customers table with business intelligence columns
-- This will make the customers table a complete customer profile

DO $$ 
BEGIN
    -- Add financial tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'total_spent') THEN
        ALTER TABLE public.customers ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added total_spent column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'last_order_amount') THEN
        ALTER TABLE public.customers ADD COLUMN last_order_amount DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added last_order_amount column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'average_order_value') THEN
        ALTER TABLE public.customers ADD COLUMN average_order_value DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added average_order_value column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'customer_lifetime_value') THEN
        ALTER TABLE public.customers ADD COLUMN customer_lifetime_value DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added customer_lifetime_value column';
    END IF;
    
    -- Add loyalty program columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'points_balance') THEN
        ALTER TABLE public.customers ADD COLUMN points_balance INTEGER DEFAULT 0;
        RAISE NOTICE 'Added points_balance column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'points_earned') THEN
        ALTER TABLE public.customers ADD COLUMN points_earned INTEGER DEFAULT 0;
        RAISE NOTICE 'Added points_earned column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'points_redeemed') THEN
        ALTER TABLE public.customers ADD COLUMN points_redeemed INTEGER DEFAULT 0;
        RAISE NOTICE 'Added points_redeemed column';
    END IF;
    
    -- Add store card balance (for store card programs)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'card_balance') THEN
        ALTER TABLE public.customers ADD COLUMN card_balance DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added card_balance column';
    END IF;
    
    -- Add visit tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'visit_count') THEN
        ALTER TABLE public.customers ADD COLUMN visit_count INTEGER DEFAULT 1;
        RAISE NOTICE 'Added visit_count column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'last_visit_date') THEN
        ALTER TABLE public.customers ADD COLUMN last_visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added last_visit_date column';
    END IF;
    
    -- Add redemption tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'redemption_count') THEN
        ALTER TABLE public.customers ADD COLUMN redemption_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added redemption_count column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'last_redemption_date') THEN
        ALTER TABLE public.customers ADD COLUMN last_redemption_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_redemption_date column';
    END IF;
    
    -- Add order tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'last_order_date') THEN
        ALTER TABLE public.customers ADD COLUMN last_order_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_order_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'order_count') THEN
        ALTER TABLE public.customers ADD COLUMN order_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added order_count column';
    END IF;
    
    -- Add membership tier and plan (derived from pass data but stored for performance)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'membership_tier') THEN
        ALTER TABLE public.customers ADD COLUMN membership_tier TEXT DEFAULT 'Standard';
        RAISE NOTICE 'Added membership_tier column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'membership_plan') THEN
        ALTER TABLE public.customers ADD COLUMN membership_plan TEXT DEFAULT 'Basic';
        RAISE NOTICE 'Added membership_plan column';
    END IF;
    
    -- Add offer tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'current_offer') THEN
        ALTER TABLE public.customers ADD COLUMN current_offer TEXT DEFAULT '';
        RAISE NOTICE 'Added current_offer column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'past_offers') THEN
        ALTER TABLE public.customers ADD COLUMN past_offers JSONB DEFAULT '[]';
        RAISE NOTICE 'Added past_offers column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'offers_claimed_count') THEN
        ALTER TABLE public.customers ADD COLUMN offers_claimed_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added offers_claimed_count column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'offers_redeemed_count') THEN
        ALTER TABLE public.customers ADD COLUMN offers_redeemed_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added offers_redeemed_count column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'last_offer_claimed_date') THEN
        ALTER TABLE public.customers ADD COLUMN last_offer_claimed_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_offer_claimed_date column';
    END IF;
    
    -- Add customer notes and tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'notes') THEN
        ALTER TABLE public.customers ADD COLUMN notes TEXT DEFAULT '';
        RAISE NOTICE 'Added notes column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'tags') THEN
        ALTER TABLE public.customers ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added tags column';
    END IF;
    
    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON public.customers(total_spent);
    CREATE INDEX IF NOT EXISTS idx_customers_points_balance ON public.customers(points_balance);
    CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON public.customers(last_visit_date);
    CREATE INDEX IF NOT EXISTS idx_customers_membership_tier ON public.customers(membership_tier);
    CREATE INDEX IF NOT EXISTS idx_customers_current_offer ON public.customers(current_offer);
    CREATE INDEX IF NOT EXISTS idx_customers_offers_claimed ON public.customers(offers_claimed_count);
    
    RAISE NOTICE 'Enhanced customers table with business intelligence columns';
    
END $$;

-- Show the enhanced schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

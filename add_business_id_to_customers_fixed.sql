-- Add business_id column to customers table for multi-tenant architecture
-- This ensures all customers are properly linked to their respective businesses

DO $$ 
BEGIN
    -- Add business_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'business_id') THEN
        ALTER TABLE public.customers ADD COLUMN business_id UUID;
        RAISE NOTICE 'Added business_id column to customers table';
    ELSE
        RAISE NOTICE 'business_id column already exists in customers table';
    END IF;
    
    -- Add foreign key constraint to link customers to businesses (via accounts)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'customers_business_id_fkey') THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_business_id_fkey 
        FOREIGN KEY (business_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for business_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for business_id already exists';
    END IF;
    
    -- Create index for performance on business_id queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'customers' AND indexname = 'idx_customers_business_id') THEN
        CREATE INDEX idx_customers_business_id ON public.customers(business_id);
        RAISE NOTICE 'Created index on customers.business_id';
    ELSE
        RAISE NOTICE 'Index on customers.business_id already exists';
    END IF;
    
    -- Update RLS policies to include business_id filtering
    -- Drop existing policies and recreate with business filtering
    DROP POLICY IF EXISTS "Users can manage their customers" ON public.customers;
    DROP POLICY IF EXISTS "Customers can view their own records" ON public.customers;
    DROP POLICY IF EXISTS "Business owners can manage their customers" ON public.customers;
    
    -- Policy for business owners/admins to manage customers in their business
    -- Using 'owner' and 'admin' only since 'staff' caused enum error
    CREATE POLICY "Business owners can manage their customers" ON public.customers
        FOR ALL USING (
            business_id IN (
                SELECT account_id FROM public.account_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        );
    
    -- Alternative policy if you want to include staff with different approach
    -- You can uncomment this if your enum actually supports staff
    /*
    CREATE POLICY "Business staff can view customers" ON public.customers
        FOR SELECT USING (
            business_id IN (
                SELECT account_id FROM public.account_members 
                WHERE user_id = auth.uid() 
                AND role = 'staff'
            )
        );
    */
    
    -- Policy for customers to view their own records
    CREATE POLICY "Customers can view their own records" ON public.customers
        FOR SELECT USING (email = auth.email());
    
    RAISE NOTICE 'Updated RLS policies for multi-tenant customer access';
    
END $$;

-- Show the actual enum values in your account_members table
SELECT 
    e.enumlabel as role_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = (
    SELECT udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'account_members' 
    AND column_name = 'role'
    LIMIT 1
)
ORDER BY e.enumsortorder;

-- Show the current schema of customers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

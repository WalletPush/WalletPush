-- Fix RLS policies for customers table to allow public signups
-- The current policy is blocking customer signups because they're not authenticated users

DO $$ 
BEGIN
    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS "Business owners can manage their customers" ON public.customers;
    DROP POLICY IF EXISTS "Customers can view their own records" ON public.customers;
    DROP POLICY IF EXISTS "Users can manage their customers" ON public.customers;
    
    -- Policy for PUBLIC customer signups (landing pages)
    -- Allow anyone to INSERT customer records (for signups)
    CREATE POLICY "Allow public customer signups" ON public.customers
        FOR INSERT WITH CHECK (true);
    
    -- Policy for business owners/admins to VIEW/UPDATE/DELETE their customers
    CREATE POLICY "Business owners can manage their customers" ON public.customers
        FOR ALL USING (
            -- Allow if user is owner/admin of the business
            business_id IN (
                SELECT account_id FROM public.account_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
        );
    
    -- Policy for customers to view their own records (when they're authenticated)
    CREATE POLICY "Customers can view their own records" ON public.customers
        FOR SELECT USING (
            -- Allow if the customer is viewing their own record
            email = auth.email()
            OR
            -- Or if no user is authenticated (public view for pass generation)
            auth.uid() IS NULL
        );
    
    RAISE NOTICE 'Updated RLS policies to allow public customer signups';
    
END $$;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'customers'
ORDER BY policyname;

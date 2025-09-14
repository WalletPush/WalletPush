-- Add missing html_content column to agency_sales_pages table
ALTER TABLE public.agency_sales_pages 
ADD COLUMN IF NOT EXISTS html_content TEXT;

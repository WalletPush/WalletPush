-- Add content_model column to agency_sales_pages table
-- This column will store the extracted content model for dynamic components

ALTER TABLE public.agency_sales_pages 
ADD COLUMN content_model jsonb NULL DEFAULT '{}'::jsonb;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.agency_sales_pages.content_model IS 'JSON object containing extracted content model for dynamic components (header, pricing, footer)';

-- Add index for content_model queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_agency_sales_pages_content_model 
ON public.agency_sales_pages USING gin (content_model) 
TABLESPACE pg_default;

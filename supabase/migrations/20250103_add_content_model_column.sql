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

-- Preview columns for robust iframe rendering and default template
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='agency_sales_pages' AND column_name='html_full_preview'
  ) THEN
    ALTER TABLE public.agency_sales_pages ADD COLUMN html_full_preview text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='agency_sales_pages' AND column_name='html_static'
  ) THEN
    ALTER TABLE public.agency_sales_pages ADD COLUMN html_static text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='agency_sales_pages' AND column_name='assets_base'
  ) THEN
    ALTER TABLE public.agency_sales_pages ADD COLUMN assets_base text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='agency_sales_pages' AND column_name='is_default'
  ) THEN
    ALTER TABLE public.agency_sales_pages ADD COLUMN is_default boolean DEFAULT false;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS agency_sales_pages_default_one
ON public.agency_sales_pages (is_default) WHERE is_default = true;

-- Add template_id column to landing_pages table to link with pass templates

-- Add template_id column to landing_pages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'landing_pages' AND column_name = 'template_id') THEN
        ALTER TABLE public.landing_pages ADD COLUMN template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add settings column if it doesn't exist (for storing wizard configuration)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'landing_pages' AND column_name = 'settings') THEN
        ALTER TABLE public.landing_pages ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create index for template_id
CREATE INDEX IF NOT EXISTS idx_landing_pages_template_id ON public.landing_pages(template_id);

-- Update any existing landing pages to have default template (optional)
-- UPDATE public.landing_pages 
-- SET template_id = (SELECT id FROM public.templates LIMIT 1)
-- WHERE template_id IS NULL;

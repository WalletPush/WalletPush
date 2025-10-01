# WalletPush Custom Domains System - Complete Implementation Guide

## CRITICAL: Start from commit `7c3d033` - "🔒 SECURITY FIX: Remove dangerous cross-account contamination in middl…"

This document outlines the complete 3-tier custom domain system that needs to be implemented for WalletPush.

## System Overview

### 3-Tier Architecture
1. **Platform Level**: `walletpush.io` (Software owner's main domain)
2. **Agency Level**: `myagency.com` (White-labeled agencies under platform owner)
3. **Business Level**: `mybusiness.com` (Individual businesses under agencies)

### Core Flow
- Businesses signing up at `walletpush.io` → belong to platform owner's agency
- Businesses signing up at `myagency.com` → belong to that specific agency
- All agency pages use agency's custom domain: `myagency.com/agency/auth/login`
- Business pages with custom domain use: `mybusiness.com/customer/dashboard`

## 1. Database Schema Requirements

### Custom Domains Table
```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  domain_type TEXT NOT NULL CHECK (domain_type IN ('agency', 'business')),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agency_accounts(id) ON DELETE CASCADE,
  
  -- VERCEL INTEGRATION FIELDS (CRITICAL)
  vercel_domain_id TEXT, -- Vercel's internal domain ID
  verification_instructions JSONB, -- CNAME/TXT records from Vercel
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'error')),
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'error')),
  dns_verified_at TIMESTAMPTZ,
  last_verification_attempt TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Either business_id OR agency_id must be set based on domain_type
  CONSTRAINT custom_domains_owner_check CHECK (
    (domain_type = 'business' AND business_id IS NOT NULL AND agency_id IS NULL) OR
    (domain_type = 'agency' AND agency_id IS NOT NULL AND business_id IS NULL)
  )
);
```

### Branding System Tables
```sql
-- Add branding columns to existing tables
ALTER TABLE agency_accounts ADD COLUMN logo_url TEXT;
ALTER TABLE agency_accounts ADD COLUMN primary_color TEXT DEFAULT '#3B82F6';
ALTER TABLE agency_accounts ADD COLUMN secondary_color TEXT DEFAULT '#1E40AF';

ALTER TABLE businesses ADD COLUMN logo_url TEXT;
ALTER TABLE businesses ADD COLUMN primary_color TEXT DEFAULT '#3B82F6';
ALTER TABLE businesses ADD COLUMN secondary_color TEXT DEFAULT '#1E40AF';

-- Branding assets table for secure storage metadata
CREATE TABLE branding_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('agency', 'business')),
  entity_id UUID NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'favicon', 'banner')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  domain_locked TEXT, -- Domain this asset is locked to
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Functions
```sql
-- Function to resolve domain context
CREATE OR REPLACE FUNCTION resolve_domain_context(input_domain TEXT)
RETURNS TABLE (
  domain_type TEXT,
  owner_id UUID,
  owner_name TEXT,
  agency_id UUID,
  agency_name TEXT,
  business_id UUID,
  business_name TEXT
);

-- Function to get branding for domain
CREATE OR REPLACE FUNCTION get_branding_for_domain(input_domain TEXT)
RETURNS TABLE (
  logo_url TEXT,
  company_name TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  branding_type TEXT
);
```

## 2. Platform Owner Dashboard (`/platform/owner`)

### Security Requirements
- **ONLY** accessible by platform owner email: `david.sambor@icloud.com`
- Must verify user email matches exactly before showing any content

### Core Features
1. **Create New Agencies**
   - Agency name
   - Contact email
   - Custom domain (e.g., `myagency.com`)
   - Agency plan selection (starter/business/pro based on TOTAL passes: 100k/150k/250k)
   - Logo upload (stored in Vercel Blob: `agency/{agency_id}/logo.{ext}`)
   - Auto-generate secure password
   - Create Supabase auth user
   - Set up initial agency settings

2. **Agency Management**
   - List all agencies with status
   - Show custom domains
   - Display business counts
   - Show subscription plans
   - Platform owner shows as "WalletPush Platform [Owner]" (not trial)

### API Endpoints Required
- `GET /api/platform/agencies` - List all agencies (platform owner only)
- `POST /api/platform/create-agency` - Create new agency with all setup
- `POST /api/platform/fix-owner-status` - Fix platform owner status in DB

## 3. Custom Domains System

### API Endpoints
- `GET /api/custom-domains` - List domains for current user context
- `POST /api/custom-domains` - Create new domain
- `GET /api/custom-domains/[id]` - Get specific domain
- `PUT /api/custom-domains/[id]` - Update domain status
- `DELETE /api/custom-domains/[id]` - Delete domain
- `POST /api/custom-domains/[id]/verify` - Verify DNS configuration

### Domain Management Features
1. **VERCEL API INTEGRATION** (CRITICAL - ALL DOMAINS LIVE ON VERCEL)
   - Use Vercel API to add domains to project
   - Fetch real CNAME/TXT records from Vercel
   - Automatic SSL certificate provisioning
   - Real-time domain verification status

2. **Domain Status Tracking**
   - pending → verified → error states
   - SSL status: pending → active → error
   - Vercel domain ID tracking
   - DNS verification timestamps

## 4. Dynamic Branding System

### Logo Resolution Hierarchy
1. **Business Domain** (`mybusiness.com`) → Business logo
2. **Agency Domain** (`myagency.com`) → Agency logo  
3. **Platform Domain** (`walletpush.io`) → WalletPush logo

### Security Requirements
- **Domain Locking**: Logos tied to specific domains
- **No Cross-Contamination**: Business cannot overwrite agency branding
- **Vercel Blob Storage**: Organized as `agency/{id}/` and `business/{id}/`

### Components Required
- `DynamicLogo.tsx` - Resolves correct logo based on current domain
- `BrandingProvider.tsx` - React context for branding throughout app
- Logo upload only available AFTER custom domain is active

## 5. Business Settings Page (`/business/settings`)

### Tabs Required
1. **Custom Fields** - Placeholder for now
2. **Custom Domains** - Domain management interface
3. **White Label** - Logo upload (only if custom domain active)
4. **SMTP/Email** - Placeholder
5. **Security** - Placeholder
6. **Billing** - Placeholder
7. **Team** - Placeholder
8. **API Keys** - Placeholder

### White Label Requirements
- **Conditional Access**: Only show if business has active custom domain
- **Logo Upload**: Direct to Vercel Blob with domain locking
- **Security Notice**: Show which domain logo is locked to

## 6. Agency Settings Page (`/agency/settings`)

### Features
- Custom domain management for agency
- Logo upload for agency branding
- SMTP configuration
- Team management
- Billing management

## 7. Middleware & Routing

### Domain Resolution
- `src/lib/domain-resolver.ts` - Core domain resolution logic
- `src/middleware.ts` - Route requests based on domain context
- Header injection for domain context (`x-domain-type`, `x-owner-id`, etc.)

### Route Handling
- Agency routes: `myagency.com/agency/*` → agency dashboard
- Business routes: `mybusiness.com/business/*` → business dashboard  
- Customer routes: `mybusiness.com/customer/*` → customer dashboard
- Pass routes: **UNCHANGED** - must not be affected by domain system

## 8. Business Signup Flow

### Domain-Based Agency Assignment
- Signup at `walletpush.io` → Platform owner's agency
- Signup at `myagency.com` → That specific agency
- Use `resolveDomainContext()` to determine owning agency
- Redirect to appropriate login after signup

## 9. File Structure

```
src/
├── app/
│   ├── platform/
│   │   └── owner/
│   │       └── page.tsx                    # Platform owner dashboard
│   ├── business/
│   │   └── settings/
│   │       └── page.tsx                    # Business settings
│   ├── agency/
│   │   └── settings/
│   │       └── page.tsx                    # Agency settings
│   └── api/
│       ├── platform/
│       │   ├── agencies/route.ts           # List agencies
│       │   ├── create-agency/route.ts      # Create agency
│       │   └── fix-owner-status/route.ts   # Fix owner status
│       ├── custom-domains/
│       │   ├── route.ts                    # CRUD domains
│       │   └── [id]/
│       │       ├── route.ts                # Individual domain
│       │       └── verify/route.ts         # Verify DNS
│       └── branding/
│           └── upload/route.ts             # Upload logos
├── components/
│   └── branding/
│       ├── DynamicLogo.tsx                 # Dynamic logo component
│       └── BrandingProvider.tsx            # Branding context
├── lib/
│   ├── domain-resolver.ts                  # Core domain logic
│   ├── branding-resolver.ts                # Branding resolution
│   ├── vercel-domains-api.ts               # Vercel API integration
│   └── vercel-blob-branding.ts             # Blob storage utilities
└── middleware.ts                           # Request routing
```

## 10. Environment Variables Required

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WALLET_PUSH_AGENCY_ACCOUNT_ID=

# VERCEL INTEGRATION (CRITICAL)
VERCEL_TOKEN=your_vercel_token               # Vercel API token
VERCEL_PROJECT_ID=your_project_id            # Vercel project ID
# VERCEL_TEAM_ID=your_team_id                # Only if using team account

# New
NEXT_PUBLIC_ROOT_DOMAIN=walletpush.io
BLOB_READ_WRITE_TOKEN=                       # Vercel Blob token
```

## 11. Implementation Order

1. **Database Migration** - Create tables and functions with Vercel fields
2. **Vercel API Integration** - Core domain management utilities
3. **Platform Owner Dashboard** - Core agency management
4. **Custom Domains API** - CRUD operations with Vercel integration
5. **Domain Resolution System** - Middleware and routing
6. **Business Settings Page** - Domain management UI
7. **Dynamic Branding System** - Logo resolution
8. **Agency Settings Page** - Agency domain management
9. **Business Signup Integration** - Domain-based assignment

## 12. Testing Requirements

### Critical Tests
- Platform owner access control
- Domain resolution accuracy
- Logo resolution hierarchy
- Business signup agency assignment
- Pass generation routes (must remain unaffected)

### Test Scenarios
- `walletpush.io` → Platform branding
- `myagency.com` → Agency branding
- `mybusiness.com` → Business branding
- Cross-domain security (no contamination)

## 13. Security Considerations

### Access Control
- Platform owner dashboard: Email verification only
- Agency settings: Agency members only
- Business settings: Business members only
- Logo uploads: Domain-locked storage

### Data Isolation
- Strict RLS policies
- No cross-tenant data access
- Domain-based branding isolation
- Secure file storage paths

## CRITICAL SUCCESS CRITERIA

1. ✅ Platform owner can create agencies with custom domains
2. ✅ Agencies get their own branded portal at their domain
3. ✅ Businesses created under agencies inherit agency branding
4. ✅ Business custom domains override agency branding
5. ✅ Pass generation routes remain completely unaffected
6. ✅ No cross-contamination between tenants
7. ✅ Full Vercel API integration for domain management
8. ✅ Secure logo storage with domain locking

## DEAL: Start Fresh Implementation

Starting from commit `7c3d033`, implement each component systematically following this specification. No shortcuts, no breaking existing functionality, and thorough testing at each step.

**AGREED?**

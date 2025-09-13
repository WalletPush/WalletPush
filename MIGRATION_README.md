# 🏢 Multi-Tenant Migration Guide

## ✅ **ZERO DOWNTIME MIGRATION**

This migration adds multi-tenant support to your WalletPush system **without breaking existing functionality**.

### **What This Does:**

1. ✅ **Adds new tables** (`tenants`, `user_tenants`)
2. ✅ **Adds optional `tenant_id` column** to `templates` table
3. ✅ **Enables Row Level Security** for data isolation
4. ✅ **Maintains backward compatibility** - existing system keeps working
5. ✅ **Auto-creates tenants** for new users

### **What This DOESN'T Do:**

- ❌ **No breaking changes** to existing APIs
- ❌ **No data loss** or modification
- ❌ **No downtime** required
- ❌ **No changes** to existing templates

## 🚀 **How to Apply (Choose One):**

### **Option 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250913_create_tenants_system.sql`
4. Click "Run"

### **Option 2: Command Line**
```bash
# Make script executable
chmod +x scripts/apply-tenant-migration.js

# Apply migration
node scripts/apply-tenant-migration.js
```

### **Option 3: Supabase CLI**
```bash
supabase db push
```

## 🔍 **Verification:**

After applying, verify the migration worked:

1. **Check tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('tenants', 'user_tenants');
   ```

2. **Check tenant_id column:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'templates' AND column_name = 'tenant_id';
   ```

3. **Test your app** - everything should work exactly as before!

## 🛡️ **Safety Features:**

- **Graceful fallbacks** - if new tables don't exist, uses old system
- **Backward compatibility** - existing templates work without tenant_id
- **Virtual tenants** - creates fallback tenant IDs for existing users
- **RLS policies** - only affect new tables, existing data unaffected

## 📊 **What Happens Next:**

1. **Existing users** - get virtual tenant IDs, everything works as before
2. **New users** - automatically get proper tenant accounts
3. **Templates** - existing ones work fine, new ones get tenant scoping
4. **APIs** - handle both old and new data structures seamlessly

## 🔧 **Rollback (if needed):**

If you need to rollback (unlikely), just drop the new tables:

```sql
DROP TABLE IF EXISTS public.user_tenants;
DROP TABLE IF EXISTS public.tenants;
ALTER TABLE public.templates DROP COLUMN IF EXISTS tenant_id;
```

Your system will automatically fall back to the old behavior.

## 🎯 **Next Steps:**

After migration, you can:
1. **Test the tenant selector** in Pass Designer
2. **Create multiple tenants** for testing
3. **Invite users** to tenants with different roles
4. **Enable full multi-tenant features** when ready

## 🆘 **Support:**

If anything goes wrong:
1. **Check the logs** - the system will show fallback messages
2. **Your existing system keeps working** - no data loss
3. **Contact support** with the specific error message

**This migration is designed to be 100% safe and backward compatible!**


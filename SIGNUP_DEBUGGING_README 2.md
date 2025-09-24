# WalletPush Customer Signup Critical Bug - README for New Claude

## CURRENT STATUS: BROKEN
Customer signup creates customer record but fails to create pass record due to NULL program_id constraint violation.

## THE CORE PROBLEM
**ERROR:** `null value in column "program_id" of relation "passes" violates not-null constraint`

**WHAT HAPPENS:**
1. ✅ Customer gets created successfully in `customers` table
2. ❌ Pass insert fails due to NULL program_id 
3. ✅ Customer gets deleted (cleanup works)
4. ❌ User gets error message

## RECENT ERROR DETAILS (From Peter Smith signup)
```json
{
  "passError": {
    "code": "23502",
    "message": "null value in column \"program_id\" of relation \"passes\" violates not-null constraint"
  },
  "insertData": {
    "customer_id": "b23b46a9-39e6-4ee1-bfcf-b288e8c1111c",
    "business_id": "be023bdf-c668-4cec-ac51-65d3c02ea191", 
    "template_id": "7c252dcb-81e6-4850-857b-9b071f33ceb1",
    "platform": "apple",
    "serial": "wp-1758493139858-t3ufr4a23",
    "object_id": "pass.come.globalwalletpush",
    "pass_data": {
      "First_Name": "Peter",
      "Last_Name": "smith", 
      "Email": "petersmith@gmail.com"
    }
  }
}
```

**KEY OBSERVATION:** Notice `program_id` is MISSING from insertData! This means `actualTemplate.program_id` is undefined/null.

## DATABASE VERIFICATION
The template DOES have a valid program_id:
```sql
SELECT id, program_id FROM templates WHERE id = '7c252dcb-81e6-4850-857b-9b071f33ceb1';
-- Result: program_id = '942d80e3-3cd5-4337-81d1-c785e6a73d05'
```

## THE BROKEN CODE FLOW
**File:** `src/app/api/customer-signup/route.ts`

**Issue:** Template queries are not properly selecting `program_id` field, causing `actualTemplate.program_id` to be undefined.

**Current template queries around lines 92-103 and 123-133:**
```typescript
.select(`
  id,
  program_id,  // <-- Recently added but still not working
  template_json,
  passkit_json,
  pass_type_identifier,
  account_id,
  programs (id, name)
`)
```

## PASSES TABLE CONSTRAINTS
```sql
-- program_id is NOT NULL - this is causing the constraint violation
"program_id" uuid NOT NULL
```

## MANUAL WORKAROUNDS THAT WORK
Manual pass creation works fine:
```sql
INSERT INTO passes (customer_id, business_id, program_id, template_id, platform, serial, object_id, pass_data) 
VALUES ('customer-id', 'business-id', '942d80e3-3cd5-4337-81d1-c785e6a73d05', 'template-id', 'apple', 'serial', 'object-id', '{}');
```

## DEBUGGING SETUP
The customer-signup API has extensive debug logging that outputs to error messages. To see debug info:
1. Try signup
2. Error message will contain full debug JSON with insertData and template info

## ARCHITECTURE OVERVIEW
```
Customer Signup Flow:
1. Fetch landing page + template
2. Generate Apple Pass with customer data  
3. Save customer to customers table ✅
4. Save pass to passes table ❌ (fails here)
5. Return success/error
```

## KEY FILES
- `src/app/api/customer-signup/route.ts` - Main signup API (BROKEN)
- `src/app/api/apple-pass/[serialNumber]/download/route.ts` - Pass download (WORKS)
- Database tables: `customers`, `passes`, `templates`, `programs`

## WHAT NEEDS TO BE FIXED
1. **ROOT CAUSE:** Figure out why `actualTemplate.program_id` is undefined despite being in the SELECT query
2. **VERIFY:** Template query is actually returning program_id field
3. **TEST:** Ensure insertData contains program_id before database insert

## QUICK WIN APPROACH
Instead of debugging the template query, you could:
1. Hardcode program_id: `'942d80e3-3cd5-4337-81d1-c785e6a73d05'`
2. Or query it separately if template.program_id is null
3. Then debug the template query later

## PREVIOUS FAILED ATTEMPTS
- Added program_id to template SELECT queries (didn't work)
- Disabled RLS on passes table (was needed)
- Added extensive logging (helpful for debugging)
- Fixed JSON validation (was helpful)

## SUCCESS CRITERIA
When fixed, signup should:
1. Create customer record
2. Create pass record with valid program_id
3. Allow pass download with real customer data
4. No more "Template not found" errors

## CURRENT TEST CASE
- Landing Page: Blue Karma Loyalty (id: e0f681ca-26e4-448b-b7f2-a9a28bd66633)
- Template: 7c252dcb-81e6-4850-857b-9b071f33ceb1
- Expected program_id: 942d80e3-3cd5-4337-81d1-c785e6a73d05

**The bug is 100% in the template data fetching - actualTemplate.program_id is coming back as undefined despite the database having the correct value.**

#!/usr/bin/env node

/**
 * Fix Blue Karma template to use proper placeholders instead of hardcoded field keys
 * Run with: node scripts/fix-blue-karma-template.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const BLUE_KARMA_TEMPLATE_ID = 'ae76dc2a-e295-4219-b5ce-f6ecd8961de1';

// Updated template with proper placeholders
const fixedPasskitJson = {
  "formatVersion": 1,
  "passTypeIdentifier": "pass.come.globalwalletpush",
  "teamIdentifier": "NC4W34D5LD",
  "organizationName": "Blue Karma Secrets",
  "description": "Welcome to our Wellness Journey Passport - complete 4 out of 6 wellness destinations within 90 days to unlock exclusive rewards",
  "backgroundColor": "#FFFFFF",
  "foregroundColor": "#625C51",
  "labelColor": "#625C51",
  "serialNumber": "wp-placeholder-serial",
  "barcodes": [
    {
      "format": "PKBarcodeFormatQR",
      "altText": "${MEMBER_ID}",
      "message": "${MEMBER_ID}",
      "messageEncoding": "iso-8859-1"
    }
  ],
  "storeCard": {
    "backFields": [
      {
        "id": "back_first_name",
        "key": "First_Name",
        "type": "backFields",
        "label": "First Name",
        "value": "${First_Name}"
      },
      {
        "id": "back_last_name", 
        "key": "Last_Name",
        "type": "backFields",
        "label": "Last Name",
        "value": "${Last_Name}"
      },
      {
        "id": "back_email",
        "key": "Email",
        "type": "backFields",
        "label": "Email",
        "value": "${Email}"
      },
      {
        "id": "back_phone",
        "key": "Phone",
        "type": "backFields",
        "label": "Phone",
        "value": "${Phone}"
      },
      {
        "id": "back_member_id",
        "key": "Member_ID",
        "type": "backFields",
        "label": "Member ID",
        "value": "${Member_ID}"
      }
    ],
    "headerFields": [
      {
        "id": "header_points",
        "key": "Points",
        "type": "headerFields",
        "label": "Points",
        "value": "${Points}"
      }
    ],
    "primaryFields": [],
    "auxiliaryFields": [],
    "secondaryFields": [
      {
        "id": "secondary_current_offer",
        "key": "Current_Offer",
        "type": "secondaryFields",
        "label": "Current Offer",
        "value": "${Current_Offer}"
      }
    ]
  },
  // Add placeholder metadata for the passkit generator
  "placeholders": {
    "First_Name": "John",
    "Last_Name": "Doe", 
    "Email": "john.doe@bluekarma.com",
    "Phone": "+1-234-567-8900",
    "Member_ID": "BK1234",
    "Points": "0",
    "Current_Offer": "20% off all services"
  }
};

async function fixBlueKarmaTemplate() {
  try {
    console.log('🔧 Fixing Blue Karma template placeholders...');
    
    // Get current template
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', BLUE_KARMA_TEMPLATE_ID)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching template:', fetchError);
      return;
    }
    
    if (!currentTemplate) {
      console.error('❌ Blue Karma template not found');
      return;
    }
    
    console.log('📋 Current template found:', currentTemplate.name);
    
    // Update the template with fixed placeholders
    const { error: updateError } = await supabase
      .from('templates')
      .update({
        passkit_json: fixedPasskitJson,
        updated_at: new Date().toISOString()
      })
      .eq('id', BLUE_KARMA_TEMPLATE_ID);
    
    if (updateError) {
      console.error('❌ Error updating template:', updateError);
      return;
    }
    
    console.log('✅ Blue Karma template updated successfully!');
    console.log('✅ Fixed placeholders:');
    console.log('   - First_Name, Last_Name, Email, Phone');
    console.log('   - Member_ID, Points, Current_Offer');
    console.log('✅ Removed hardcoded field keys like key_1758424718345');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the fix
fixBlueKarmaTemplate();

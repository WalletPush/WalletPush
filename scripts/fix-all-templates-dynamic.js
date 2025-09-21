#!/usr/bin/env node

/**
 * Dynamic Template Fixer for ALL businesses
 * 
 * This script will:
 * 1. Find all templates with hardcoded field keys (like key_1758424718345)
 * 2. Extract actual field labels and convert them to proper placeholders
 * 3. Update templates to use ${placeholder} format dynamically
 * 
 * Run with: node scripts/fix-all-templates-dynamic.js
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

/**
 * Convert field label to proper placeholder name
 */
function labelToPlaceholder(label) {
  return label
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .split(/\s+/) // Split by whitespace
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case
    .join('_'); // Join with underscores
}

/**
 * Check if a string looks like a hardcoded field key
 */
function isHardcodedKey(key) {
  // Patterns like: key_1758424718345, back_1758254345269_0, etc.
  return /^(key_|back_|header_|secondary_|primary_|auxiliary_)\d+/.test(key) ||
         /^\d+$/.test(key) || // Pure numbers
         key.includes('1758'); // Your specific timestamp pattern
}

/**
 * Fix a template's field structure
 */
function fixTemplateFields(passkitJson) {
  const fixed = JSON.parse(JSON.stringify(passkitJson)); // Deep clone
  const placeholders = {};
  
  // Function to fix fields in any section
  function fixFieldsInSection(fields, sectionName) {
    if (!Array.isArray(fields)) return;
    
    fields.forEach(field => {
      if (field.key && isHardcodedKey(field.key)) {
        // Create placeholder from label
        const placeholderName = labelToPlaceholder(field.label || 'Unknown');
        const placeholderValue = `\${${placeholderName}}`;
        
        console.log(`  🔧 ${sectionName}: "${field.label}" -> ${placeholderName}`);
        
        // Update the field
        field.key = placeholderName;
        field.value = placeholderValue;
        
        // Add to placeholders with sensible default
        placeholders[placeholderName] = getDefaultValue(placeholderName, field.label);
      }
    });
  }
  
  // Fix all field sections
  if (fixed.storeCard) {
    fixFieldsInSection(fixed.storeCard.backFields, 'backFields');
    fixFieldsInSection(fixed.storeCard.headerFields, 'headerFields');
    fixFieldsInSection(fixed.storeCard.primaryFields, 'primaryFields');
    fixFieldsInSection(fixed.storeCard.secondaryFields, 'secondaryFields');
    fixFieldsInSection(fixed.storeCard.auxiliaryFields, 'auxiliaryFields');
  }
  
  // Also check other pass types
  ['eventTicket', 'coupon', 'boardingPass', 'generic'].forEach(passType => {
    if (fixed[passType]) {
      fixFieldsInSection(fixed[passType].backFields, `${passType}.backFields`);
      fixFieldsInSection(fixed[passType].headerFields, `${passType}.headerFields`);
      fixFieldsInSection(fixed[passType].primaryFields, `${passType}.primaryFields`);
      fixFieldsInSection(fixed[passType].secondaryFields, `${passType}.secondaryFields`);
      fixFieldsInSection(fixed[passType].auxiliaryFields, `${passType}.auxiliaryFields`);
    }
  });
  
  // Fix barcode message if it has hardcoded values
  if (fixed.barcodes && Array.isArray(fixed.barcodes)) {
    fixed.barcodes.forEach(barcode => {
      if (barcode.message && !barcode.message.startsWith('${')) {
        // If it's not already a placeholder, make it one
        barcode.message = '${Member_ID}';
        barcode.altText = '${Member_ID}';
        placeholders['Member_ID'] = 'MB001';
        console.log('  🔧 Barcode: Updated to use Member_ID placeholder');
      }
    });
  }
  
  // Add placeholders metadata
  if (Object.keys(placeholders).length > 0) {
    fixed.placeholders = placeholders;
  }
  
  return fixed;
}

/**
 * Get sensible default value for a placeholder
 */
function getDefaultValue(placeholderName, originalLabel) {
  const lower = (placeholderName + ' ' + (originalLabel || '')).toLowerCase();
  
  if (lower.includes('first') && lower.includes('name')) return 'John';
  if (lower.includes('last') && lower.includes('name')) return 'Doe';
  if (lower.includes('email')) return 'customer@example.com';
  if (lower.includes('phone')) return '+1-234-567-8900';
  if (lower.includes('member') && lower.includes('id')) return 'MB001';
  if (lower.includes('points')) return '0';
  if (lower.includes('balance')) return '0.00';
  if (lower.includes('offer')) return 'Welcome bonus';
  if (lower.includes('tier') || lower.includes('level')) return 'Standard';
  if (lower.includes('company')) return 'Example Corp';
  if (lower.includes('address')) return '123 Main St';
  if (lower.includes('city')) return 'San Francisco';
  if (lower.includes('state')) return 'CA';
  if (lower.includes('zip')) return '94102';
  
  return `Sample ${placeholderName}`;
}

/**
 * Main function to fix all templates
 */
async function fixAllTemplates() {
  try {
    console.log('🔍 Finding all templates with potential hardcoded field keys...');
    
    // Get all templates
    const { data: templates, error } = await supabase
      .from('templates')
      .select('id, template_json, passkit_json, account_id')
      .not('passkit_json', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching templates:', error);
      return;
    }
    
    console.log(`📋 Found ${templates.length} templates to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const template of templates) {
      console.log(`\n🔍 Checking template ${template.id}...`);
      
      if (!template.passkit_json) {
        console.log('  ⏭️ Skipping - no passkit_json');
        skippedCount++;
        continue;
      }
      
      // Check if template needs fixing
      const templateStr = JSON.stringify(template.passkit_json);
      const hasHardcodedKeys = /("key":\s*"(?:key_|back_|header_|secondary_)\d+|"key":\s*"\d+")/g.test(templateStr);
      
      if (!hasHardcodedKeys) {
        console.log('  ✅ Template looks good - no hardcoded keys found');
        skippedCount++;
        continue;
      }
      
      console.log('  🔧 Template needs fixing - found hardcoded keys');
      
      // Fix the template
      const fixedPasskitJson = fixTemplateFields(template.passkit_json);
      
      // Update in database
      const { error: updateError } = await supabase
        .from('templates')
        .update({
          passkit_json: fixedPasskitJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);
      
      if (updateError) {
        console.error(`  ❌ Error updating template ${template.id}:`, updateError);
      } else {
        console.log(`  ✅ Template ${template.id} fixed successfully`);
        fixedCount++;
      }
    }
    
    console.log(`\n🎉 Template fixing complete!`);
    console.log(`   ✅ Fixed: ${fixedCount} templates`);
    console.log(`   ⏭️ Skipped: ${skippedCount} templates`);
    console.log(`   📋 Total: ${templates.length} templates checked`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the fix
fixAllTemplates();

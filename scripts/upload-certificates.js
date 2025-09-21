#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function uploadCertificate(certPath, description, isGlobal = false) {
  try {
    console.log(`📤 Uploading certificate: ${certPath}`);
    
    const formData = new FormData();
    formData.append('certificate', fs.createReadStream(certPath));
    formData.append('password', 'walletpush'); // Default password - update if different
    formData.append('description', description);
    formData.append('is_global', isGlobal.toString());
    
    const response = await fetch(`${BASE_URL}/api/pass-type-ids`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let FormData set it with boundary
        ...formData.getHeaders()
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Successfully uploaded: ${description}`);
      console.log(`   Pass Type ID: ${result.passTypeId?.pass_type_identifier}`);
      console.log(`   Database ID: ${result.passTypeId?.id}`);
    } else {
      console.error(`❌ Failed to upload ${description}:`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error uploading ${description}:`, error.message);
    return null;
  }
}

async function uploadAllCertificates() {
  console.log('🚀 Starting certificate upload process...\n');
  
  const certsDir = path.join(__dirname, '../private/certificates');
  
  // Upload regular certificates
  const regularCerts = [
    'cert_1757690901247.p12',
    'cert_1757691024002.p12', 
    'cert_1757691111028.p12'
  ];
  
  for (const cert of regularCerts) {
    const certPath = path.join(certsDir, cert);
    if (fs.existsSync(certPath)) {
      await uploadCertificate(certPath, `Production Certificate ${cert}`, false);
      console.log(''); // Empty line for readability
    } else {
      console.log(`⚠️ Certificate not found: ${certPath}`);
    }
  }
  
  // Upload global certificate
  const globalCertPath = path.join(certsDir, 'global/global_cert_1757709927817.p12');
  if (fs.existsSync(globalCertPath)) {
    await uploadCertificate(globalCertPath, 'Global Production Certificate', true);
  } else {
    console.log(`⚠️ Global certificate not found: ${globalCertPath}`);
  }
  
  console.log('\n🎉 Certificate upload process completed!');
}

// Run the upload process
uploadAllCertificates().catch(console.error);

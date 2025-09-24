#!/bin/bash

# Certificate upload script for WalletPush
# Uploads all certificates from private/certificates to production

BASE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
CERTS_DIR="$(dirname "$0")/../private/certificates"

echo "🚀 Starting certificate upload process..."
echo "📍 Base URL: $BASE_URL"
echo "📁 Certificates directory: $CERTS_DIR"
echo ""

# Function to upload a certificate
upload_cert() {
    local cert_path="$1"
    local description="$2"
    local is_global="$3"
    local password="${4:-walletpush}"
    
    if [ ! -f "$cert_path" ]; then
        echo "⚠️  Certificate not found: $cert_path"
        return 1
    fi
    
    echo "📤 Uploading: $description"
    echo "   File: $cert_path"
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -F "certificate=@$cert_path" \
        -F "password=$password" \
        -F "description=$description" \
        -F "is_global=$is_global" \
        "$BASE_URL/api/pass-type-ids")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Successfully uploaded: $description"
        echo "   Response: $body"
    else
        echo "❌ Failed to upload: $description (HTTP $http_code)"
        echo "   Error: $body"
    fi
    echo ""
}

# Upload regular certificates
echo "📋 Uploading regular certificates..."
upload_cert "$CERTS_DIR/cert_1757690901247.p12" "Production Certificate 1757690901247" "false"
upload_cert "$CERTS_DIR/cert_1757691024002.p12" "Production Certificate 1757691024002" "false" 
upload_cert "$CERTS_DIR/cert_1757691111028.p12" "Production Certificate 1757691111028" "false"

# Upload global certificate
echo "📋 Uploading global certificate..."
upload_cert "$CERTS_DIR/global/global_cert_1757709927817.p12" "Global Production Certificate" "true"

echo "🎉 Certificate upload process completed!"

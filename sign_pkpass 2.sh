#!/bin/bash

# Canonical PKPass Signing Script
# Based on the recipe that actually works with iOS Wallet
# 
# Usage: ./sign_pkpass.sh <pass_directory> <cert.p12> <WWDR.cer> [output.pkpass]
#
# This script follows the exact process that works with iOS Wallet:
# 1. Build manifest.json with SHA-1 hashes
# 2. Extract cert and key from .p12
# 3. Sign with PKCS#7, detached, DER format, including WWDR
# 4. Verify with Apple roots
# 5. Zip cleanly

set -e  # Exit on any error

# Check arguments
if [ $# -lt 3 ]; then
    echo "Usage: $0 <pass_directory> <cert.p12> <WWDR.cer> [output.pkpass]"
    echo ""
    echo "Example:"
    echo "  $0 ./my-pass ./globalwalletpush.p12 ./AppleWWDRCAG4.cer my-pass.pkpass"
    exit 1
fi

PASSDIR="$1"
P12="$2"
WWDR="$3"
OUTPUT="${4:-out.pkpass}"

# Validate inputs
if [ ! -d "$PASSDIR" ]; then
    echo "❌ Error: Pass directory '$PASSDIR' not found"
    exit 1
fi

if [ ! -f "$P12" ]; then
    echo "❌ Error: P12 certificate '$P12' not found"
    exit 1
fi

if [ ! -f "$WWDR" ]; then
    echo "❌ Error: WWDR certificate '$WWDR' not found"
    exit 1
fi

if [ ! -f "$PASSDIR/pass.json" ]; then
    echo "❌ Error: pass.json not found in '$PASSDIR'"
    exit 1
fi

echo "🔐 Canonical PKPass Signing Process"
echo "📁 Pass Directory: $PASSDIR"
echo "🔑 P12 Certificate: $P12"
echo "📜 WWDR Certificate: $WWDR"
echo "📦 Output: $OUTPUT"
echo ""

# Step 1: Build manifest.json (SHA-1 of every file EXCEPT manifest.json & signature)
echo "1️⃣ Building manifest.json..."
python3 - <<PY
import os, json, hashlib
root = '$PASSDIR'
def sha1(p):
    h=hashlib.sha1()
    with open(p,'rb') as f:
        for ch in iter(lambda:f.read(8192), b''): h.update(ch)
    return h.hexdigest()

files=[f for f in os.listdir(root) if f not in ('manifest.json','signature')]
print(f"📋 Files to hash: {files}")
m={f: sha1(os.path.join(root,f)) for f in files}
print(f"🔍 Manifest hashes: {m}")

with open(os.path.join(root,'manifest.json'),'w',encoding='utf-8') as out:
    json.dump(m,out,separators=(',',':'))
print("✅ manifest.json created")
PY

# Step 2: Extract leaf cert + key (use -legacy for modern OpenSSL)
echo ""
echo "2️⃣ Extracting certificate and key from P12..."
openssl pkcs12 -legacy -in "$P12" -clcerts -nokeys -out "$PASSDIR/pass-cert.pem" -passin pass:
openssl pkcs12 -legacy -in "$P12" -nocerts -nodes -out "$PASSDIR/pass-key.pem" -passin pass:

# Extract and display certificate details for validation
echo "🔍 Certificate details:"
openssl x509 -in "$PASSDIR/pass-cert.pem" -noout -subject -issuer
echo ""

# Step 3: Sign manifest.json (PKCS#7, detached, DER, include WWDR)
echo "3️⃣ Signing manifest.json with PKCS#7..."
(
  cd "$PASSDIR" && \
  openssl smime -binary -sign \
    -signer pass-cert.pem \
    -inkey  pass-key.pem \
    -certfile "../$WWDR" \
    -in manifest.json \
    -out signature \
    -outform DER \
    -md sha256
)
echo "✅ Signature created"

# Step 4: Verify (OpenSSL) with Apple roots + WWDR
echo ""
echo "4️⃣ Verifying signature with Apple roots..."
security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/apple_roots.pem
openssl smime -verify \
  -in "$PASSDIR/signature" -inform DER \
  -content "$PASSDIR/manifest.json" \
  -certfile "$WWDR" \
  -CAfile /tmp/apple_roots.pem \
  -purpose any -out /tmp/verification_result

if [ $? -eq 0 ]; then
    echo "✅ Signature verification successful"
else
    echo "❌ Signature verification failed"
    exit 1
fi

# Step 5: Zip (files at ROOT, strip Mac metadata)
echo ""
echo "5️⃣ Creating PKPass archive..."
# Remove any existing output file
rm -f "$OUTPUT"

# Create the zip with files at root level, no Mac metadata
(cd "$PASSDIR" && zip -r -X "../$OUTPUT" . -x "pass-cert.pem" "pass-key.pem")

# Clean up temporary files
rm -f "$PASSDIR/pass-cert.pem" "$PASSDIR/pass-key.pem" /tmp/apple_roots.pem /tmp/verification_result

echo "✅ PKPass created: $OUTPUT"
echo ""

# Final validation
echo "🔍 Final validation:"
echo "📦 Archive contents:"
unzip -l "$OUTPUT"
echo ""

# Check file size
SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null || echo "unknown")
echo "📏 File size: $SIZE bytes"

echo ""
echo "🎯 Success! Your PKPass is ready for testing:"
echo "   1. AirDrop test: AirDrop $OUTPUT to iPhone → should show Wallet add sheet"
echo "   2. HTTP test: Serve with Content-Type: application/vnd.apple.pkpass"
echo ""
echo "⚠️  Guard rails checklist:"
echo "   - Verify passTypeIdentifier in pass.json matches your P12 certificate"
echo "   - Verify teamIdentifier in pass.json matches your P12 certificate"
echo "   - Test via AirDrop first before testing HTTP delivery"
PY

chmod +x sign_pkpass.sh

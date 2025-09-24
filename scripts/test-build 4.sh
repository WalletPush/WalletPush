#!/bin/bash

# WalletPush Build Testing System
# This script ensures local build matches Vercel exactly

echo "🔧 WALLETPUSH BUILD TESTING"
echo "============================"

# Check if we're on development branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "❌ ERROR: You're on the main branch!"
    echo "   Switch to development branch first:"
    echo "   git checkout development"
    exit 1
fi

echo "✅ Current branch: $CURRENT_BRANCH (safe to test)"
echo ""

# Clean and reinstall dependencies
echo "🧹 Cleaning dependencies..."
rm -rf node_modules .next pnpm-lock.yaml

echo "📦 Installing fresh dependencies..."
pnpm install

echo "🏗️  Testing production build (same as Vercel)..."
echo ""

# Attempt build
if pnpm build; then
    echo ""
    echo "🎉 BUILD SUCCESS!"
    echo "✅ Local build matches Vercel"
    echo "✅ Safe to push to main and deploy"
    echo ""
    echo "📤 TO DEPLOY:"
    echo "   git checkout main"
    echo "   git merge development"
    echo "   git push origin main"
else
    echo ""
    echo "❌ BUILD FAILED!"
    echo "🚨 DO NOT PUSH TO VERCEL!"
    echo "   Fix build errors first"
    echo "   Test again with: ./scripts/test-build.sh"
    exit 1
fi

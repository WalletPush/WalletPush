#!/bin/bash

# WalletPush Auto-Backup Protection System
# This script creates automatic backups before any risky operations

BACKUP_DIR="/Users/davidsambor/Desktop/WalletPush_BACKUPS"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🛡️  WALLETPUSH PROTECTION SYSTEM"
echo "================================"
echo "Current branch: $CURRENT_BRANCH"
echo "Creating backup: $TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create timestamped backup
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
cp -r . "$BACKUP_PATH"

# Remove node_modules and .next from backup (too large)
rm -rf "$BACKUP_PATH/node_modules"
rm -rf "$BACKUP_PATH/.next"

echo "✅ Backup created: $BACKUP_PATH"
echo ""
echo "📋 PROTECTION RULES:"
echo "1. NEVER work directly on main branch"
echo "2. ALWAYS run 'pnpm build' before pushing to Vercel"
echo "3. Use development branch for experiments"
echo "4. Run this script before risky changes"
echo ""
echo "🚨 TO RESTORE FROM BACKUP:"
echo "   cp -r '$BACKUP_PATH'/* ."
echo "   pnpm install"

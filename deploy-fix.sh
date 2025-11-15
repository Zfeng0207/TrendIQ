#!/bin/bash
# Beauty CRM - Deployment Fix Script
# This script will clean up and redeploy with correct trial account settings

echo "🧹 Step 1: Aborting failed deployment..."
cf deploy -i 1331b83b-c246-11f0-b1b7-eeee0a9999c5 -a abort

echo ""
echo "🗑️  Step 2: Deleting existing conflicting services..."
cf delete-service beautyleads-db -f
cf delete-service beautyleads-auth -f

echo ""
echo "⏳ Waiting for services to be deleted (30 seconds)..."
sleep 30

echo ""
echo "🏗️  Step 3: Rebuilding MTA archive with fixed configuration..."
cd /Users/junquan.chin/Projects/beautyleads
rm -rf mta_archives/ .beautyleads_mta_build_tmp/
mbt build

echo ""
echo "🚀 Step 4: Deploying to SAP BTP..."
cf deploy mta_archives/beautyleads_1.0.0.mtar

echo ""
echo "✅ Deployment process complete!"
echo "Check status with: cf apps"


#!/bin/bash

# Unified Deployment Script for Game Fast
# Usage: ./deploy.sh [original|github]

set -e

DEPLOY_TARGET=${1:-"github"}

echo "🚀 Starting deployment to: $DEPLOY_TARGET"

if [ "$DEPLOY_TARGET" = "original" ]; then
    echo "📦 Building for original repository..."
    npm run build
    
    echo "📝 Committing and pushing to original repo..."
    git add .
    git commit -m "Build and deploy - $(date)"
    git push origin main
    
    echo "✅ Deployed to original repository!"
    
elif [ "$DEPLOY_TARGET" = "github" ]; then
    echo "📦 Building for GitHub Pages..."
    npm run build:deploy
    
    echo "📋 Copying files for GitHub Pages..."
    npm run copy:deploy
    
    echo "📝 Committing and pushing to GitHub Pages..."
    git add .
    git commit -m "Deploy to GitHub Pages - $(date)"
    git push deploy main
    
    echo "✅ Deployed to GitHub Pages!"
    echo "🌐 Your game is live at: https://perfectjared.github.io/miw2-deploy/"
    
else
    echo "❌ Invalid deployment target. Use 'original' or 'github'"
    echo "Usage: ./deploy.sh [original|github]"
    exit 1
fi

echo "🎉 Deployment complete!"

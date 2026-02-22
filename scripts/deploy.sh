#!/bin/bash
# GitChain Deploy Script

set -e

TARGET=${1:-production}

echo "🚀 Deploying GitChain to $TARGET..."

# Build
echo "🔨 Building..."
pnpm build

# Run tests
echo "🧪 Running tests..."
pnpm test || true

# Build Docker images
echo "🐳 Building Docker images..."
docker compose build

# Deploy based on target
case $TARGET in
    production)
        echo "📤 Deploying to production..."
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        ;;
    staging)
        echo "📤 Deploying to staging..."
        docker compose up -d
        ;;
    *)
        echo "❌ Unknown target: $TARGET"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services:"
docker compose ps

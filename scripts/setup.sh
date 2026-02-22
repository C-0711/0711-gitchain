#!/bin/bash
# GitChain Setup Script

set -e

echo "🚀 Setting up GitChain..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d. -f1 | tr -d v)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ required (found: $(node -v))"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build packages
echo "🔨 Building packages..."
pnpm build

# Create data directory
echo "📁 Creating data directory..."
mkdir -p /data/gitchain/repos

# Copy environment file if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚙️ Created .env file - please configure it"
fi

echo ""
echo "✅ GitChain setup complete!"
echo ""
echo "Next steps:"
echo "  1. Configure .env file"
echo "  2. Run: pnpm dev"
echo "  3. Visit: http://localhost:3000"

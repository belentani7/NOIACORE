#!/bin/bash
set -e

echo "🚀 SETUP AGENCIA IA"
echo "===================="

# 1. Check dependencies
echo "📦 Checking dependencies..."
if ! command -v bun &> /dev/null; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
fi

if ! command -v ocx &> /dev/null; then
  echo "Installing ocx..."
  npm install -g @bitkyc08/opencodex
fi

# 2. Install project dependencies
echo "📥 Installing dependencies..."
bun install

# 3. Setup database
echo "🗄️  Setting up database..."
bun run db:generate
bun run db:push

# 4. Create .env if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from template..."
  cp .env-template .env
  echo "⚠️  EDIT .env WITH YOUR API KEYS"
fi

# 5. Seed database (optional)
# echo "🌱 Seeding database..."
# bun run db:seed

echo ""
echo "✅ SETUP COMPLETE"
echo "===================="
echo ""
echo "🚀 To start development:"
echo "   bun run dev"
echo ""
echo "📖 To build for production:"
echo "   bun run build"
echo "   bun run start"
echo ""

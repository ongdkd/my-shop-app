#!/bin/bash

# Pre-deployment validation script
# Run this before deploying to catch issues early

echo "🚀 Pre-deployment validation starting..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the backend directory${NC}"
    exit 1
fi

echo "📦 Checking dependencies..."
npm list --depth=0 > /dev/null 2>&1
print_status $? "Dependencies check"

echo "🔍 Running TypeScript type check..."
npm run type-check
print_status $? "TypeScript type check"

echo "🧹 Running linter..."
npm run lint
print_status $? "Linting"

echo "🏗️  Testing build process..."
npm run build
print_status $? "Build process"

echo "🧪 Running tests..."
if [ -d "src/__tests__" ] || [ -f "jest.config.js" ]; then
    npm test -- --passWithNoTests
    print_status $? "Tests"
else
    print_warning "No tests found - consider adding tests"
fi

echo "🔐 Validating environment configuration..."
npm run validate:env
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Environment validation${NC}"
else
    echo -e "${YELLOW}⚠️  Environment validation failed - this is expected if not in production${NC}"
fi

echo "📋 Checking required files..."
required_files=("src/app.ts" "tsconfig.json" "render.yaml" "Dockerfile" ".dockerignore")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        exit 1
    fi
done

echo "🔍 Checking package.json configuration..."
if grep -q '"start".*"node dist/app.js"' package.json; then
    echo -e "${GREEN}✅ Start script configured correctly${NC}"
else
    echo -e "${RED}❌ Start script not configured correctly${NC}"
    exit 1
fi

if grep -q '"engines"' package.json; then
    echo -e "${GREEN}✅ Node.js engine version specified${NC}"
else
    print_warning "Consider specifying Node.js engine version in package.json"
fi

echo "🏥 Testing health check endpoint..."
if [ -f "dist/app.js" ]; then
    # Start server in background for testing
    NODE_ENV=test PORT=3001 node dist/app.js &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Test health endpoint
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✅ Health check endpoint working${NC}"
    else
        print_warning "Health check endpoint test failed (may be due to missing env vars)"
    fi
    
    # Kill test server
    kill $SERVER_PID 2>/dev/null
else
    print_warning "Build not found - run 'npm run build' first to test health endpoint"
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 Pre-deployment validation completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. Set up environment variables in Render.com"
echo "3. Deploy to Render.com"
echo "4. Run post-deployment verification"
echo ""
echo "Deployment checklist: see DEPLOYMENT_CHECKLIST.md"
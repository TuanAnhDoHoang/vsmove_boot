#!/bin/bash

# Smart Contract Deployment and Testing Script

echo "🚀 Starting VMC Smart Contract Deployment and Testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    print_error "Sui CLI not found. Please install it first."
    exit 1
fi

print_status "Sui CLI found"

# Navigate to smart contract directory
cd vmc || { print_error "vmc directory not found"; exit 1; }

print_status "Building smart contract..."

# Build the smart contract
if sui move build; then
    print_status "Smart contract built successfully"
else
    print_error "Failed to build smart contract"
    exit 1
fi

print_status "Running Move tests..."

# Run Move tests
if sui move test; then
    print_status "All Move tests passed"
else
    print_error "Move tests failed"
    exit 1
fi

print_warning "To deploy to testnet, run: sui client publish --gas-budget 100000000"

# Navigate back to frontend
cd ../visMove || { print_error "visMove directory not found"; exit 1; }

print_status "Installing frontend dependencies..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    npm install
fi

print_status "Running frontend tests..."

# Run Jest tests
if npm test; then
    print_status "All frontend tests passed"
else
    print_error "Frontend tests failed"
    exit 1
fi

print_status "Starting development server..."
print_warning "Frontend will be available at http://localhost:9002"

# Start the development server
npm run dev
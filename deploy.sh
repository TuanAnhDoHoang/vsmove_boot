#!/bin/bash

# VMC Smart Contract Deployment Script
# This script deploys the smart contract and sets up the environment

set -e

echo "🚀 Starting VMC Smart Contract Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v sui &> /dev/null; then
        print_error "Sui CLI not found. Please install it first."
        echo "Visit: https://docs.sui.io/guides/developer/getting-started/sui-install"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install it first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install it first."
        exit 1
    fi
    
    print_status "All prerequisites found"
}

# Deploy smart contract
deploy_contract() {
    print_info "Deploying smart contract..."
    
    cd vmc || { print_error "vmc directory not found"; exit 1; }
    
    # Build contract
    print_info "Building contract..."
    if sui move build; then
        print_status "Contract built successfully"
    else
        print_error "Failed to build contract"
        exit 1
    fi
    
    # Run tests
    print_info "Running Move tests..."
    if sui move test; then
        print_status "All Move tests passed"
    else
        print_error "Move tests failed"
        exit 1
    fi
    
    # Deploy to testnet
    print_info "Deploying to testnet..."
    DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 --json)
    
    if [ $? -eq 0 ]; then
        print_status "Contract deployed successfully"
        
        # Extract package ID and object IDs
        PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
        REGISTRY_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("ExplanationRegistry")) | .objectId')
        ADMIN_CAP_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("AdminCap")) | .objectId')
        
        print_info "Package ID: $PACKAGE_ID"
        print_info "Registry ID: $REGISTRY_ID"
        print_info "Admin Cap ID: $ADMIN_CAP_ID"
        
        # Update environment file
        cd ../visMove
        
        if [ -f .env.local ]; then
            # Update existing file
            sed -i "s/NEXT_PUBLIC_PACKAGE_ID=.*/NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID/" .env.local
            sed -i "s/NEXT_PUBLIC_REGISTRY_ID=.*/NEXT_PUBLIC_REGISTRY_ID=$REGISTRY_ID/" .env.local
            sed -i "s/NEXT_PUBLIC_ADMIN_CAP_ID=.*/NEXT_PUBLIC_ADMIN_CAP_ID=$ADMIN_CAP_ID/" .env.local
        else
            # Create new file from example
            cp .env.example .env.local
            sed -i "s/NEXT_PUBLIC_PACKAGE_ID=0x0/NEXT_PUBLIC_PACKAGE_ID=$PACKAGE_ID/" .env.local
            sed -i "s/NEXT_PUBLIC_REGISTRY_ID=0x0/NEXT_PUBLIC_REGISTRY_ID=$REGISTRY_ID/" .env.local
            sed -i "s/NEXT_PUBLIC_ADMIN_CAP_ID=0x0/NEXT_PUBLIC_ADMIN_CAP_ID=$ADMIN_CAP_ID/" .env.local
        fi
        
        print_status "Environment variables updated"
        
    else
        print_error "Failed to deploy contract"
        exit 1
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd visMove || { print_error "visMove directory not found"; exit 1; }
    
    # Install dependencies
    print_info "Installing dependencies..."
    if npm install; then
        print_status "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    # Run tests
    print_info "Running frontend tests..."
    if npm test -- --watchAll=false; then
        print_status "Frontend tests passed"
    else
        print_warning "Some frontend tests failed, but continuing..."
    fi
    
    cd ..
}

# Main execution
main() {
    print_info "VMC Smart Contract Deployment & Setup"
    print_info "======================================"
    
    check_prerequisites
    deploy_contract
    setup_frontend
    
    print_status "Deployment completed successfully!"
    print_info ""
    print_info "Next steps:"
    print_info "1. Update your .env.local file with any additional API keys"
    print_info "2. Start the development server: cd visMove && npm run dev"
    print_info "3. Visit http://localhost:9002 to see your application"
    print_info ""
    print_info "Contract Information:"
    print_info "- Network: Sui Testnet"
    print_info "- Package ID: $PACKAGE_ID"
    print_info "- Registry ID: $REGISTRY_ID"
    print_info "- Admin Cap ID: $ADMIN_CAP_ID"
}

# Run main function
main "$@"
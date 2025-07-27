#!/bin/bash

# Master Azure Deployment Script
# This script orchestrates the complete Azure deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Main deployment function
main() {
    echo "🚀 Sync Watch App - Azure Deployment"
    echo "===================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Check if scripts directory exists
    if [ ! -d "scripts" ]; then
        print_error "Scripts directory not found. Please run from project root."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
    echo ""
    
    # Get Azure subscription info
    SUBSCRIPTION_NAME=$(az account show --query name --output tsv)
    SUBSCRIPTION_ID=$(az account show --query id --output tsv)
    
    print_status "Azure Subscription: $SUBSCRIPTION_NAME"
    print_status "Subscription ID: $SUBSCRIPTION_ID"
    echo ""
    
    # Confirmation prompt
    read -p "🤔 Do you want to proceed with Azure deployment? This will create resources that may incur costs. (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user"
        exit 0
    fi
    
    echo ""
    print_status "Starting Azure deployment process..."
    echo ""
    
    # Step 1: Create Azure resources
    print_status "Step 1/4: Creating Azure resources..."
    if [ -f "scripts/azure-setup.sh" ]; then
        chmod +x scripts/azure-setup.sh
        if ./scripts/azure-setup.sh; then
            print_success "Azure resources created successfully"
        else
            print_error "Failed to create Azure resources"
            exit 1
        fi
    else
        print_error "Azure setup script not found"
        exit 1
    fi
    
    echo ""
    
    # Step 2: Setup database
    print_status "Step 2/4: Setting up database schema..."
    if [ -f "scripts/azure-db-setup.sh" ]; then
        chmod +x scripts/azure-db-setup.sh
        if ./scripts/azure-db-setup.sh; then
            print_success "Database setup completed"
            print_warning "⚠️  Remember to manually apply the database schema using the generated azure-db-schema.sql file"
        else
            print_error "Failed to setup database"
            exit 1
        fi
    else
        print_error "Database setup script not found"
        exit 1
    fi
    
    echo ""
    
    # Step 3: Setup monitoring
    print_status "Step 3/4: Configuring monitoring and alerts..."
    if [ -f "scripts/azure-monitoring.sh" ]; then
        chmod +x scripts/azure-monitoring.sh
        if ./scripts/azure-monitoring.sh; then
            print_success "Monitoring setup completed"
        else
            print_warning "Monitoring setup failed, but continuing deployment"
        fi
    else
        print_warning "Monitoring setup script not found"
    fi
    
    echo ""
    
    # Step 4: Build and prepare for deployment
    print_status "Step 4/4: Building application for deployment..."
    
    # Install dependencies
    print_status "Installing dependencies..."
    if npm ci; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    # Build application
    print_status "Building application..."
    if npm run build; then
        print_success "Application built successfully"
    else
        print_error "Failed to build application"
        exit 1
    fi
    
    echo ""
    print_success "🎉 Azure deployment setup completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "=============="
    echo ""
    echo "1. 🗄️  Apply database schema:"
    echo "   psql -h sync-watch-db-server.postgres.database.azure.com -p 5432 -U videosync_user -d videosync -f azure-db-schema.sql"
    echo ""
    echo "2. 🔑 Configure GitHub Secrets:"
    echo "   - AZURE_BACKEND_PUBLISH_PROFILE"
    echo "   - AZURE_FRONTEND_PUBLISH_PROFILE"
    echo ""
    echo "3. ⚙️  Set up environment variables in Azure:"
    echo "   - Google OAuth credentials"
    echo "   - YouTube API key"
    echo "   - JWT secrets"
    echo ""
    echo "4. 🚀 Deploy via GitHub Actions:"
    echo "   - Push to main or dev/phase-3 branch"
    echo "   - Or trigger manual deployment"
    echo ""
    echo "5. 📊 Access your applications:"
    echo "   - Backend:  https://sync-watch-api.azurewebsites.net"
    echo "   - Frontend: https://sync-watch-web.azurewebsites.net"
    echo "   - Monitoring: Azure Portal > Application Insights"
    echo ""
    echo "📚 For detailed instructions, see: docs/azure-deployment.md"
    echo ""
    
    # Create deployment summary
    cat > deployment-summary.txt << EOF
Sync Watch App - Azure Deployment Summary
========================================

Deployment Date: $(date)
Azure Subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)

Resources Created:
- Resource Group: sync-watch-rg
- App Service Plan: sync-watch-plan (Free F1)
- Backend App: sync-watch-api
- Frontend App: sync-watch-web
- Database: sync-watch-db-server
- Application Insights: sync-watch-insights
- Log Analytics: sync-watch-logs

URLs:
- Backend: https://sync-watch-api.azurewebsites.net
- Frontend: https://sync-watch-web.azurewebsites.net

Cost Estimate: ~\$12-15/month (PostgreSQL only, other services free tier)

Next Steps:
1. Apply database schema (azure-db-schema.sql)
2. Configure GitHub secrets for CI/CD
3. Set environment variables in Azure
4. Deploy application via GitHub Actions

Documentation: docs/azure-deployment.md
EOF
    
    print_success "Deployment summary saved to: deployment-summary.txt"
}

# Run main function
main "$@"
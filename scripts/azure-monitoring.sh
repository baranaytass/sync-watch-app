#!/bin/bash

# Azure Monitoring and Alerting Setup Script
# Sets up Application Insights, Log Analytics, and cost alerts

set -e

# Configuration
RESOURCE_GROUP="sync-watch-rg"
LOCATION="East US"
BACKEND_APP="sync-watch-api"
FRONTEND_APP="sync-watch-web"
APP_INSIGHTS="sync-watch-insights"
LOG_ANALYTICS="sync-watch-logs"

echo "📊 Setting up Azure monitoring and alerting"

# Create Log Analytics Workspace (Free tier: 5GB/month)
echo "📈 Creating Log Analytics Workspace"
az monitor log-analytics workspace create \
  --workspace-name $LOG_ANALYTICS \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku Free \
  --tags project="sync-watch-app" \
  || echo "Log Analytics workspace may already exist"

# Create Application Insights (Free tier: 5GB/month)
echo "🔍 Creating Application Insights"
az monitor app-insights component create \
  --app $APP_INSIGHTS \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --kind web \
  --workspace "/subscriptions/$(az account show --query id --output tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.OperationalInsights/workspaces/$LOG_ANALYTICS" \
  --tags project="sync-watch-app" \
  || echo "Application Insights may already exist"

# Get Application Insights connection string
echo "🔑 Getting Application Insights connection string"
INSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --app $APP_INSIGHTS \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv)

echo "📱 Configuring Application Insights for Backend"
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    APPINSIGHTS_CONNECTION_STRING="$INSIGHTS_CONNECTION_STRING" \
    APPINSIGHTS_INSTRUMENTATIONKEY="$(az monitor app-insights component show --app $APP_INSIGHTS --resource-group $RESOURCE_GROUP --query instrumentationKey --output tsv)" \
  || echo "Backend insights configuration failed"

echo "📱 Configuring Application Insights for Frontend"
az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    APPINSIGHTS_CONNECTION_STRING="$INSIGHTS_CONNECTION_STRING" \
    APPINSIGHTS_INSTRUMENTATIONKEY="$(az monitor app-insights component show --app $APP_INSIGHTS --resource-group $RESOURCE_GROUP --query instrumentationKey --output tsv)" \
  || echo "Frontend insights configuration failed"

# Create cost alert (Budget alert for $5/month)
echo "💰 Creating cost budget alert"
SUBSCRIPTION_ID=$(az account show --query id --output tsv)

# Create budget
az consumption budget create \
  --budget-name "sync-watch-budget" \
  --amount 5 \
  --time-grain Monthly \
  --time-period start-date="$(date -d "$(date +%Y-%m-01)" +%Y-%m-%dT%H:%M:%SZ)" \
  --category Cost \
  --resource-group $RESOURCE_GROUP \
  || echo "Budget may already exist"

# Create alert rules for application health
echo "🚨 Creating health monitoring alerts"

# Backend health alert
az monitor metrics alert create \
  --name "Backend Down Alert" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$BACKEND_APP" \
  --condition "count static.microsoft.web/sites.http4xx >= 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --description "Alert when backend returns too many 4xx errors" \
  || echo "Backend alert may already exist"

# Frontend health alert  
az monitor metrics alert create \
  --name "Frontend Down Alert" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$FRONTEND_APP" \
  --condition "count static.microsoft.web/sites.http4xx >= 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --description "Alert when frontend returns too many 4xx errors" \
  || echo "Frontend alert may already exist"

# High CPU alert for cost management
az monitor metrics alert create \
  --name "High CPU Usage Alert" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$BACKEND_APP" \
  --condition "avg static.microsoft.web/sites.cpupercentage > 80" \
  --window-size 15m \
  --evaluation-frequency 5m \
  --severity 3 \
  --description "Alert when CPU usage is consistently high" \
  || echo "CPU alert may already exist"

echo "📊 Monitoring setup completed!"
echo "🔗 Application Insights: https://portal.azure.com/#resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS"
echo "📈 Log Analytics: https://portal.azure.com/#resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.OperationalInsights/workspaces/$LOG_ANALYTICS"

# Create monitoring summary
cat > azure-monitoring-info.txt << EOF
Azure Monitoring Setup Summary
=============================

Application Insights: $APP_INSIGHTS
Log Analytics: $LOG_ANALYTICS
Connection String: $INSIGHTS_CONNECTION_STRING

Free Tier Limits:
- Application Insights: 5GB/month data ingestion
- Log Analytics: 5GB/month data retention (31 days)
- Budget Alert: Set to \$5/month

Alerts Created:
- Backend Down Alert: Triggers on 5+ HTTP 4xx errors in 5 minutes
- Frontend Down Alert: Triggers on 5+ HTTP 4xx errors in 5 minutes  
- High CPU Alert: Triggers when CPU > 80% for 15 minutes
- Cost Budget Alert: Triggers when monthly cost exceeds \$5

Access URLs:
- Portal: https://portal.azure.com/#resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP
- Insights: https://portal.azure.com/#resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS
EOF

echo "📄 Monitoring info saved to: azure-monitoring-info.txt"
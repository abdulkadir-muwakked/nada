#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${REVENUECAT_PROJECT_ID:-}"
APP_ID="${REVENUECAT_APP_ID:-}"

echo "RevenueCat checklist:"
echo "1) iOS app bundle ID must be: com.mouket.nada"
echo "2) Offering identifier 'default' must be set as Current"
echo "3) Package \$rc_monthly -> com.nada.premium.monthly"
echo "4) Package \$rc_annual  -> com.nada.premium.yearly"
echo

echo "Dashboard links:"
if [[ -n "$PROJECT_ID" ]]; then
  echo "  Apps:      https://app.revenuecat.com/projects/$PROJECT_ID/apps"
  echo "  Offerings: https://app.revenuecat.com/projects/$PROJECT_ID/offerings"
else
  echo "  Set REVENUECAT_PROJECT_ID to print direct dashboard links."
fi
echo

cat <<'EOF'
Optional API check (requires RevenueCat secret key):
curl -sS https://api.revenuecat.com/v1/subscribers/<APP_USER_ID> \
  -H "Authorization: Bearer $REVENUECAT_SECRET_KEY" | jq .
EOF

if [[ -n "$APP_ID" ]]; then
  echo
  echo "App ID hint configured: $APP_ID"
fi


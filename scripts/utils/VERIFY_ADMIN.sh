#!/bin/bash
# Script to verify admin credentials and reset if needed

echo "=== Admin Credential Verification ==="
echo ""

# Get admin email and password from environment or use defaults
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@codlabstudio.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@CodLabStudio2024!}"

echo "Testing login with:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""

# Test login endpoint
echo "Testing login endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "Response: $RESPONSE"
echo ""

# Check if login was successful
if echo "$RESPONSE" | grep -q "accessToken"; then
  echo "✅ Login successful!"
  echo ""
  echo "Extracted token:"
  echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | head -1
else
  echo "❌ Login failed!"
  echo ""
  echo "Possible issues:"
  echo "1. Admin user not created in database"
  echo "2. Password hash mismatch"
  echo "3. Backend not running"
  echo ""
  echo "To reset admin password, run:"
  echo "  sudo docker compose exec backend npm run db:reset"
  echo "  sudo docker compose restart backend"
fi

echo ""
echo "=== Verification Complete ==="


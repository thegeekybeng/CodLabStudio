#!/bin/bash
# Comprehensive frontend diagnosis script

echo "=== Frontend Authentication Diagnosis ==="
echo ""

echo "1. Checking container status..."
sudo docker compose ps
echo ""

echo "2. Checking backend logs (last 20 lines)..."
sudo docker compose logs backend | tail -20
echo ""

echo "3. Checking frontend logs (last 20 lines)..."
sudo docker compose logs frontend | tail -20
echo ""

echo "4. Testing backend health endpoint..."
curl -v http://localhost:3001/health 2>&1 | head -20
echo ""

echo "5. Testing backend login endpoint (should return error for missing credentials)..."
curl -v -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{}' 2>&1 | head -30
echo ""

echo "6. Testing backend login with admin credentials..."
curl -v -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"admin@universalnotebook.local","password":"Admin@UniversalNotebook2024!"}' 2>&1 | head -40
echo ""

echo "7. Checking CORS configuration..."
echo "CORS_ORIGIN in docker-compose.yml:"
grep CORS_ORIGIN docker-compose.yml
echo ""

echo "8. Checking API URL configuration..."
echo "NEXT_PUBLIC_API_URL in docker-compose.yml:"
grep NEXT_PUBLIC_API_URL docker-compose.yml
echo ""

echo "9. Checking network connectivity..."
echo "Backend port 3001:"
sudo netstat -tulpn | grep 3001 || echo "Port 3001 not listening"
echo ""
echo "Frontend port 3000:"
sudo netstat -tulpn | grep 3000 || echo "Port 3000 not listening"
echo ""

echo "10. Checking environment variables in containers..."
echo "Backend CORS_ORIGIN:"
sudo docker compose exec backend printenv | grep CORS_ORIGIN || echo "Not set"
echo ""
echo "Frontend NEXT_PUBLIC_API_URL:"
sudo docker compose exec frontend printenv | grep NEXT_PUBLIC_API_URL || echo "Not set"
echo ""

echo "=== Diagnosis Complete ==="
echo ""
echo "Common Issues:"
echo "1. CORS blocking - Check CORS_ORIGIN matches actual origin"
echo "2. API URL wrong - Check NEXT_PUBLIC_API_URL points to accessible backend"
echo "3. Network unreachable - Verify ports are exposed and accessible"
echo "4. Container not running - Check docker compose ps"


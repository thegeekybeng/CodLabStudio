#!/bin/bash
# Test backend endpoints

echo "=== Testing Backend Endpoints ==="
echo ""

echo "1. Health Check (should return JSON):"
curl -s http://localhost:3001/health | head -5
echo ""
echo ""

echo "2. Testing Registration Endpoint (should return method not allowed or validation error):"
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}' | head -10
echo ""
echo ""

echo "3. Backend Logs (last 10 lines):"
sudo docker compose logs backend | tail -10


#!/bin/bash
# Apply changes: seed admin, disable registration, add guest mode

cd /volume2/docker/UniversoteBook

echo "=== Step 1: Rebuilding backend with new changes ==="
sudo docker compose build backend

echo "=== Step 2: Restarting backend ==="
sudo docker compose restart backend

echo "=== Step 3: Waiting for backend to start (15 seconds) ==="
sleep 15

echo "=== Step 4: Checking backend logs for admin creation ==="
sudo docker compose logs backend | grep -i "admin\|seed" | tail -10

echo ""
echo "=== Step 5: Testing login endpoint ==="
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@universalnotebook.local","password":"Admin@UniversalNotebook2024!"}' | head -5

echo ""
echo ""
echo "=== Step 6: Testing registration (should be disabled) ==="
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}' | head -5

echo ""
echo ""
echo "=== Step 7: Container status ==="
sudo docker compose ps

echo ""
echo "=== ✅ Changes Applied ==="
echo "Default admin credentials:"
echo "  Email: admin@universalnotebook.local"
echo "  Password: Admin@UniversalNotebook2024!"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"


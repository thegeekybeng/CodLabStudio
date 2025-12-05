#!/bin/bash
# Final fix - Generate Prisma client and restart backend

cd /volume2/docker/UniversoteBook

echo "=== Step 1: Generating Prisma Client ==="
sudo docker compose exec backend npm run db:generate

echo "=== Step 2: Restarting backend ==="
sudo docker compose restart backend

echo "=== Step 3: Waiting for backend to start (10 seconds) ==="
sleep 10

echo "=== Step 4: Checking backend status ==="
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is responding!"
    curl http://localhost:3001/api/health
else
    echo "❌ Backend is not responding - checking logs..."
    sudo docker compose logs backend | tail -30
fi

echo ""
echo "=== Step 5: Container status ==="
sudo docker compose ps


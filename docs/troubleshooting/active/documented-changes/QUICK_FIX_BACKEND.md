# Quick Fix - Get Backend Running

## The Problem
Backend won't start because PostgreSQL has permission issues with the init directory.

## Solution: Remove Init Mount (Fastest Fix)

The init script is optional - Prisma handles all database setup. Let's remove it:

**Run these commands on your NAS:**

```bash
cd /volume2/docker/UniversoteBook

# Step 1: Comment out the init mount in docker-compose.yml
sudo sed -i 's|      - ./database/init:/docker-entrypoint-initdb.d:ro|      # - ./database/init:/docker-entrypoint-initdb.d:ro|' docker-compose.yml

# Step 2: Stop everything
sudo docker compose down

# Step 3: Remove the problematic volume (fresh start)
sudo docker volume rm universotebook_postgres_data 2>/dev/null || true

# Step 4: Start containers
sudo docker compose up -d

# Step 5: Wait for PostgreSQL to be ready (30 seconds)
echo "Waiting for PostgreSQL to start..."
sleep 30

# Step 6: Check PostgreSQL status
echo "Checking PostgreSQL..."
sudo docker compose exec postgres pg_isready -U notebook_user && echo "✅ PostgreSQL is ready" || echo "❌ PostgreSQL not ready"

# Step 7: Initialize database schema
echo "Initializing database..."
sudo docker compose exec backend npm run db:generate
sudo docker compose exec backend npm run db:migrate

# Step 8: Check backend status
echo "Checking backend..."
sudo docker compose ps | grep backend
curl -s http://localhost:3001/api/health && echo "✅ Backend is responding" || echo "❌ Backend not responding"

# Step 9: Check all containers
echo -e "\n=== All Container Status ==="
sudo docker compose ps
```

## Alternative: If Above Doesn't Work

**Option 1: Check what's actually wrong**

```bash
# See PostgreSQL logs
sudo docker compose logs postgres | tail -50

# See backend logs
sudo docker compose logs backend | tail -50

# Check if containers are running
sudo docker compose ps -a
```

**Option 2: Complete reset**

```bash
cd /volume2/docker/UniversoteBook

# Stop and remove everything
sudo docker compose down -v

# Remove any orphaned containers
sudo docker container prune -f

# Start fresh
sudo docker compose up -d --build

# Wait and initialize
sleep 45
sudo docker compose exec backend npm run db:generate
sudo docker compose exec backend npm run db:migrate
```

**Option 3: Manual PostgreSQL start**

```bash
# Start only PostgreSQL first
sudo docker compose up -d postgres

# Wait and check logs
sleep 20
sudo docker compose logs postgres

# If PostgreSQL is running, start backend
sudo docker compose up -d backend

# Check backend logs
sudo docker compose logs backend
```

## Verify Backend is Working

After running the fix:

```bash
# Test backend API
curl http://localhost:3001/api/health

# Should return: {"status":"ok"} or similar
```

If you see a response, the backend is working. Then try registration in the browser again.

## If Still Not Working

Share the output of:

```bash
sudo docker compose ps
sudo docker compose logs postgres | tail -20
sudo docker compose logs backend | tail -20
```

This will help identify the exact issue.


# Quick Fix for NAS Build Issue

## Problem
Docker build fails with "npm ci requires package-lock.json" error.

## Solution

The Dockerfiles have been updated, but you need to:

1. **Make sure you have the latest files on your NAS**
   - The updated `backend/Dockerfile.dev` and `frontend/Dockerfile.dev` files

2. **Force rebuild without cache:**

```bash
cd /volume2/docker/UniversoteBook

# Stop and remove existing containers
sudo docker compose down

# Rebuild without cache
sudo docker compose build --no-cache

# Start services
sudo docker compose up -d
```

## Alternative: Quick Manual Fix

If you can't update files, you can manually edit the Dockerfiles on your NAS:

**Edit `backend/Dockerfile.dev`:**
Change line 12 from:
```
RUN npm ci
```
To:
```
RUN npm install
```

**Edit `frontend/Dockerfile.dev`:**
Change line 9 from:
```
RUN npm ci
```
To:
```
RUN npm install
```

Then rebuild:
```bash
sudo docker compose build --no-cache
sudo docker compose up -d
```

## After Build Succeeds

Once containers are running:

```bash
# Initialize database
sudo docker compose exec backend npm run db:generate
sudo docker compose exec backend npm run db:migrate

# Check logs
sudo docker compose logs -f
```


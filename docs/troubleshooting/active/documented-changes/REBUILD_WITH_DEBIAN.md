# Rebuild with Debian Base Image

## Problem
Alpine Linux doesn't have proper OpenSSL 1.1 support for Prisma. Switching to Debian-based image.

## Solution
Changed from `node:20-alpine` to `node:20-slim` (Debian-based) which has better OpenSSL support.

## Rebuild Steps

```bash
cd /path/to/docker/UniversoteBook

# Step 1: Stop containers
sudo docker compose down

# Step 2: Rebuild backend with new base image (this will take longer)
sudo docker compose build --no-cache backend

# Step 3: Start containers
sudo docker compose up -d

# Step 4: Wait for services to start
sleep 10

# Step 5: Generate Prisma client (if needed)
sudo docker compose exec backend npm run db:generate

# Step 6: Check backend logs
sudo docker compose logs backend | tail -30

# Step 7: Test backend
curl http://localhost:3001/api/health
```

## What Changed

- **Dockerfile.dev**: Changed from `node:20-alpine` to `node:20-slim`
- **Dockerfile**: Changed from `node:20-alpine` to `node:20-slim`
- **Package manager**: Changed from `apk` (Alpine) to `apt-get` (Debian)
- **Docker CLI**: Changed from `docker-cli` to `docker.io`

## Note

The Debian-based image is slightly larger but has much better compatibility with Prisma and other native dependencies.

## Verify

After rebuilding, check:

```bash
# Backend should start without Prisma errors
sudo docker compose logs backend | grep -i "prisma\|error" | tail -10

# Should NOT see "libssl.so.1.1" errors
```


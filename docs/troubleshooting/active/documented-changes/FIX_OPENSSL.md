# Fix OpenSSL/Prisma Issue

## Problem
Prisma query engine requires `libssl.so.1.1` but Alpine Linux doesn't have it by default.

## Solution
Install `openssl1.1-compat` package in the Docker image.

## What I Fixed
- Updated `backend/Dockerfile.dev` to include `openssl1.1-compat`
- Updated `backend/Dockerfile` (production) to include `openssl1.1-compat`

## Next Steps

Rebuild the backend container:

```bash
cd /volume2/docker/UniversoteBook

# Rebuild backend with OpenSSL fix
sudo docker compose build backend

# Restart backend
sudo docker compose restart backend

# Wait a few seconds
sleep 5

# Check backend logs
sudo docker compose logs backend | tail -20

# Test backend
curl http://localhost:3001/api/health
```

## Verify It Works

After rebuilding, the backend should start without Prisma errors. Check:

```bash
# Backend should be running
sudo docker compose ps | grep backend

# No Prisma errors in logs
sudo docker compose logs backend | grep -i "prisma\|error" | tail -10
```

## If Still Not Working

If `openssl1.1-compat` doesn't work, try installing full OpenSSL:

```bash
# Edit Dockerfile.dev
# Change: RUN apk add --no-cache docker-cli openssl1.1-compat
# To: RUN apk add --no-cache docker-cli openssl openssl-dev
```

But `openssl1.1-compat` should work for Prisma's needs.


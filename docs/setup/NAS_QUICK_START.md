# NAS Quick Start - CodLabStudio

## Immediate Fix for Build Error

The build is failing because `npm ci` requires `package-lock.json`. Here's the quickest fix:

### Option 1: Update Files and Rebuild (Recommended)

1. **Make sure you have the latest `Dockerfile.dev` files on your NAS**

2. **Force rebuild without cache:**
```bash
cd /volume2/docker/UniversoteBook

# Stop existing containers
sudo docker compose down

# Remove old images (optional but recommended)
sudo docker compose rm -f

# Rebuild without cache
sudo docker compose build --no-cache

# Start services
sudo docker compose up -d
```

### Option 2: Quick Manual Edit on NAS

If you can't update files, edit directly on your NAS:

```bash
cd /volume2/docker/UniversoteBook

# Edit backend Dockerfile
nano backend/Dockerfile.dev
# Change line 12 from: RUN npm ci
# To: RUN npm install

# Edit frontend Dockerfile  
nano frontend/Dockerfile.dev
# Change line 9 from: RUN npm ci
# To: RUN npm install

# Then rebuild
sudo docker compose build --no-cache
sudo docker compose up -d
```

### Option 3: One-Line Fix (If you have sed)

```bash
cd /volume2/docker/UniversoteBook

# Replace npm ci with npm install in both Dockerfiles
sed -i 's/RUN npm ci/RUN npm install/g' backend/Dockerfile.dev
sed -i 's/RUN npm ci/RUN npm install/g' frontend/Dockerfile.dev

# Rebuild
sudo docker compose build --no-cache
sudo docker compose up -d
```

## After Build Succeeds

```bash
# 1. Check containers are running
sudo docker compose ps

# 2. Initialize database
sudo docker compose exec backend npm run db:generate
sudo docker compose exec backend npm run db:migrate

# 3. View logs to verify
sudo docker compose logs -f backend
```

## Access Application

- Frontend: `http://your-nas-ip:3000`
- Backend API: `http://your-nas-ip:3001`

## Troubleshooting

**If build still fails:**
```bash
# Check Dockerfile content
cat backend/Dockerfile.dev | grep npm

# Should show: RUN npm install
# If it shows: RUN npm ci, the file wasn't updated
```

**If containers won't start:**
```bash
# Check logs
sudo docker compose logs

# Check if ports are in use
sudo netstat -tulpn | grep -E '3000|3001|5432'
```


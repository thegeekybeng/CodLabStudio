# CodLabStudio - NAS Setup Guide

## Overview

This guide helps you set up CodLabStudio on a NAS (Network Attached Storage) system using Docker Compose. Since NAS systems often don't have Node.js/npm installed, we use Docker to handle everything.

## Prerequisites

- Docker and Docker Compose installed on your NAS
- SSH access to your NAS
- At least 2GB free disk space
- Ports 3000, 3001, 5432 available (or configure different ports)

## Quick Start (Docker Compose Only)

Since you don't have npm on your NAS, Docker will handle all dependency installation inside containers.

### 1. Copy Project Files to NAS

Transfer the entire project directory to your NAS. For example:
```bash
# From your local machine
scp -r /Users/ymca/_dev_work_/Projects/UniversoteBook user@your-nas:/volume2/docker/
```

### 2. Navigate to Project Directory

```bash
cd /volume2/docker/UniversoteBook
```

### 3. Create Environment File

Create a `.env` file in the project root:

```bash
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=notebook_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=codlabstudio
POSTGRES_PORT=5432
DATABASE_URL=postgresql://notebook_user:your_secure_password_here@postgres:5432/codlabstudio

# JWT Configuration (Generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://your-nas-ip:3000

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://your-nas-ip:3001
NEXT_PUBLIC_WS_URL=ws://your-nas-ip:3001

# Docker Configuration
DOCKER_SOCKET_PATH=/var/run/docker.sock

# File Storage
FILE_STORAGE_TYPE=local
FILE_STORAGE_PATH=./storage

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EXECUTION_TIMEOUT_MS=30000
MAX_CODE_SIZE_BYTES=10485760
EOF
```

**Important**: Replace `your-nas-ip` with your actual NAS IP address, and change the passwords and JWT secrets.

### 4. Start Services

```bash
sudo docker compose up -d --build
```

This will:
- Build the frontend and backend containers (installing npm dependencies inside)
- Pull PostgreSQL image
- Start all services

### 5. Run Database Migrations

After containers are running, initialize the database:

```bash
sudo docker compose exec backend npm run db:generate
sudo docker compose exec backend npm run db:migrate
```

### 6. Verify Services

Check that all services are running:

```bash
sudo docker compose ps
```

You should see:
- `codlabstudio-db` (postgres)
- `codlabstudio-backend` (backend)
- `codlabstudio-frontend` (frontend)

### 7. Access the Application

Open your browser and navigate to:
- Frontend: `http://your-nas-ip:3000`
- Backend API: `http://your-nas-ip:3001`

## Troubleshooting

### Container Build Fails

If you see errors about `npm ci`:
- The Dockerfiles have been updated to use `npm install` if `package-lock.json` doesn't exist
- This is normal for first-time setup

### Database Connection Issues

Check if PostgreSQL is healthy:
```bash
sudo docker compose exec postgres pg_isready -U notebook_user
```

### Permission Issues

If you see permission errors:
```bash
# Fix ownership of repos directory (for Git feature)
sudo mkdir -p repos
sudo chown -R 1001:1001 repos
```

### View Logs

```bash
# All services
sudo docker compose logs -f

# Specific service
sudo docker compose logs -f backend
sudo docker compose logs -f frontend
sudo docker compose logs -f postgres
```

### Restart Services

```bash
sudo docker compose restart
```

### Stop Services

```bash
sudo docker compose down
```

### Update Application

```bash
# Pull latest code
cd /volume2/docker/UniversoteBook
git pull  # if using git

# Rebuild and restart
sudo docker compose up -d --build

# Run migrations if schema changed
sudo docker compose exec backend npm run db:migrate
```

## Production Deployment

For production use, use the production Docker Compose file:

```bash
sudo docker compose -f docker-compose.prod.yml up -d --build
```

Make sure to:
1. Update `.env` with production values
2. Configure SSL/HTTPS if needed
3. Set up proper firewall rules
4. Configure backups

## NAS-Specific Considerations

### Disk Space
- Docker images: ~2-3GB
- Database data: Grows with usage
- Git repositories: In `./repos` directory
- Execution containers: Temporary, auto-cleaned

### Performance
- NAS systems may have limited CPU/RAM
- Consider resource limits in docker-compose.yml
- Monitor resource usage: `sudo docker stats`

### Network
- Ensure ports are accessible from your network
- Configure firewall if needed
- For external access, consider reverse proxy (Nginx)

## Security Notes

1. **Change default passwords** in `.env`
2. **Use strong JWT secrets** (32+ random characters)
3. **Restrict network access** if only internal use
4. **Regular backups** of PostgreSQL data
5. **Keep Docker updated** on your NAS

## Backup

### Database Backup
```bash
sudo docker compose exec postgres pg_dump -U notebook_user codlabstudio > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
sudo docker compose exec -T postgres psql -U notebook_user codlabstudio < backup_20241205.sql
```

## Support

If you encounter issues:
1. Check container logs
2. Verify environment variables
3. Ensure Docker has access to Docker socket
4. Check disk space and permissions


# NAS Migration Guide: Universal Notebook → CodLabStudio

This guide helps you migrate from the old Universal Notebook setup to the new CodLabStudio repository on your NAS.

## Prerequisites

- SSH access to your NAS
- Docker and Docker Compose installed on NAS
- Git installed on NAS (or use Docker for cloning)

## Step 1: Shut Down Current Universal Notebook

### Option A: Via SSH (Recommended)

```bash
# SSH into your NAS
ssh your-nas-user@your-nas-ip

# Navigate to the old directory
cd /volume2/docker/UniversoteBook  # or wherever your old setup is

# Stop and remove containers
sudo docker compose down

# Optional: Remove old containers and images (if you want to clean up)
# sudo docker compose down -v  # Removes volumes too (WARNING: deletes data)
# sudo docker rmi $(sudo docker images | grep universal-notebook | awk '{print $3}')  # Remove old images
```

### Option B: Via NAS Web Interface

1. Open your NAS Docker management interface
2. Find containers named:
   - `universal-notebook-frontend`
   - `universal-notebook-backend`
   - `universal-notebook-db`
3. Stop all containers
4. Optionally remove them if you're not keeping the old setup

## Step 2: Clone CodLabStudio Repository

### Option A: Direct Git Clone (if Git is installed on NAS)

```bash
# SSH into your NAS
ssh your-nas-user@your-nas-ip

# Navigate to Docker directory
cd /volume2/docker

# Clone the repository
sudo git clone https://github.com/thegeekybeng/CodLabStudio.git

# Set proper permissions
sudo chown -R your-nas-user:your-nas-group /volume2/docker/CodLabStudio
```

### Option B: Using Docker Container (if Git is not installed)

```bash
# SSH into your NAS
ssh your-nas-user@your-nas-ip

# Navigate to Docker directory
cd /volume2/docker

# Use Docker to clone (one-time use)
sudo docker run --rm -v /volume2/docker:/workspace -w /workspace alpine/git clone https://github.com/thegeekybeng/CodLabStudio.git

# Set proper permissions
sudo chown -R your-nas-user:your-nas-group /volume2/docker/CodLabStudio
```

### Option C: Manual Download (if Git is not available)

1. Download the repository as ZIP from: https://github.com/thegeekybeng/CodLabStudio/archive/refs/heads/main.zip
2. Extract to `/volume2/docker/CodLabStudio`
3. Set proper permissions:
   ```bash
   sudo chown -R your-nas-user:your-nas-group /volume2/docker/CodLabStudio
   ```

## Step 3: Configure Environment Variables

```bash
# Navigate to the new directory
cd /volume2/docker/CodLabStudio

# Create .env file (copy from example if exists, or create new)
# For NAS, you'll need to update these values:

# Database Configuration
POSTGRES_USER=notebook_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=codlabstudio
POSTGRES_PORT=5432

# Backend Configuration
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_change_in_production
BCRYPT_ROUNDS=12

# CORS and API URLs (IMPORTANT: Update with your NAS IP)
CORS_ORIGIN=http://localhost:3000,http://your-nas-ip:3000
NEXT_PUBLIC_API_URL=http://your-nas-ip:3001
NEXT_PUBLIC_WS_URL=ws://your-nas-ip:3001

# Admin Account (optional - will be auto-created)
ADMIN_EMAIL=admin@codlabstudio.local
ADMIN_PASSWORD=Admin@CodLabStudio2024!
```

**Important**: Replace `your-nas-ip` with your actual NAS IP address (e.g., `192.168.1.100`).

## Step 4: Set Up Database Permissions

```bash
# Ensure database init scripts are readable
sudo chmod -R 755 /volume2/docker/CodLabStudio/database/init
```

## Step 5: Start CodLabStudio

```bash
# Navigate to the directory
cd /volume2/docker/CodLabStudio

# Start services
sudo docker compose up -d

# Check logs to ensure everything is running
sudo docker compose logs -f
```

## Step 6: Verify Installation

1. **Check containers are running:**
   ```bash
   sudo docker compose ps
   ```
   You should see:
   - `codlabstudio-db` (postgres)
   - `codlabstudio-backend`
   - `codlabstudio-frontend`

2. **Check backend health:**
   ```bash
   curl http://localhost:3001/health
   # or from your local machine:
   curl http://your-nas-ip:3001/health
   ```

3. **Access the frontend:**
   - Open browser: `http://your-nas-ip:3000`
   - You should see the CodLabStudio login page

## Step 7: Access CodLabStudio

### Admin Login
- **Email**: `admin@codlabstudio.local`
- **Password**: `Admin@CodLabStudio2024!` (or whatever you set in .env)

### Guest Mode
- Click "Continue as Guest" on the login page
- Accept the End User Agreement (EUA)
- Complete the onboarding tour

## Troubleshooting

### Port Conflicts
If ports 3000 or 3001 are already in use:
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Update docker-compose.yml to use different ports if needed
```

### Database Connection Issues
```bash
# Check database container logs
sudo docker compose logs postgres

# Verify database is healthy
sudo docker compose exec postgres pg_isready -U notebook_user
```

### Permission Issues
```bash
# Fix permissions on database init scripts
sudo chmod -R 755 /volume2/docker/CodLabStudio/database/init

# Fix permissions on repos directory (for Git feature)
sudo mkdir -p /volume2/docker/CodLabStudio/repos
sudo chmod 777 /volume2/docker/CodLabStudio/repos
```

### Frontend Not Connecting to Backend
- Verify `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` in `.env` match your NAS IP
- Verify `CORS_ORIGIN` includes your NAS IP
- Check backend logs: `sudo docker compose logs backend`

## Migration Checklist

- [ ] Old Universal Notebook containers stopped
- [ ] CodLabStudio repository cloned to `/volume2/docker/CodLabStudio`
- [ ] Environment variables configured (especially NAS IP addresses)
- [ ] Database init permissions set correctly
- [ ] Docker containers started successfully
- [ ] Frontend accessible at `http://your-nas-ip:3000`
- [ ] Backend health check passes
- [ ] Admin login works
- [ ] Guest mode works

## Next Steps

1. **Change default admin password** after first login
2. **Review security settings** in production
3. **Set up backups** for the database volume
4. **Configure SSL/HTTPS** if exposing to internet (see DEPLOYMENT.md)

## Cleanup (Optional)

If you want to remove the old Universal Notebook setup:

```bash
# WARNING: This will delete all old data
cd /volume2/docker/UniversoteBook  # or wherever your old setup is
sudo docker compose down -v  # Removes volumes and data
sudo rm -rf /volume2/docker/UniversoteBook  # Remove directory
```

---

**Need Help?** Check the troubleshooting guides in `docs/troubleshooting/`


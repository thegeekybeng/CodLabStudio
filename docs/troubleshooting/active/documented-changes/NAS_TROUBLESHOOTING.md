# NAS Troubleshooting Guide

## Port Conflicts

### PostgreSQL Port Already in Use

**Solution**: PostgreSQL port mapping has been removed from `docker-compose.yml` since the backend connects via Docker's internal network.

**Why this works:**
- Backend container connects to PostgreSQL using service name `postgres:5432`
- This uses Docker's internal network, not external ports
- No external port mapping needed

**If you need external PostgreSQL access:**
1. Find an available port:
   ```bash
   sudo netstat -tulpn | grep LISTEN
   ```

2. Edit `docker-compose.yml` and uncomment/update the ports section:
   ```yaml
   ports:
     - "5434:5432"  # Use any available port
   ```

## Common Issues

### 1. Containers Won't Start

**Check logs:**
```bash
sudo docker compose logs
```

**Common causes:**
- Port conflicts (see above)
- Insufficient disk space
- Docker daemon not running

### 2. Database Connection Errors

**Verify PostgreSQL is healthy:**
```bash
sudo docker compose exec postgres pg_isready -U notebook_user
```

**Check backend can connect:**
```bash
sudo docker compose exec backend npm run db:generate
```

### 3. Permission Errors

**Fix repos directory:**
```bash
sudo mkdir -p repos
sudo chown -R 1001:1001 repos
```

**Fix storage directory:**
```bash
sudo mkdir -p storage
sudo chown -R 1001:1001 storage
```

### 4. Build Cache Issues

**Force rebuild:**
```bash
sudo docker compose build --no-cache
sudo docker compose up -d
```

### 5. Container Keeps Restarting

**Check logs:**
```bash
sudo docker compose logs backend
sudo docker compose logs frontend
```

**Common causes:**
- Environment variables missing
- Database not ready
- Port conflicts

## Useful Commands

### Check Container Status
```bash
sudo docker compose ps
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
# All services
sudo docker compose restart

# Specific service
sudo docker compose restart backend
```

### Stop and Remove
```bash
sudo docker compose down

# Remove volumes too (WARNING: deletes data)
sudo docker compose down -v
```

### Execute Commands in Containers
```bash
# Backend shell
sudo docker compose exec backend sh

# Database shell
sudo docker compose exec postgres psql -U notebook_user -d codlabstudio
```

### Check Resource Usage
```bash
sudo docker stats
```

## Network Issues

### Can't Access from Browser

1. **Check containers are running:**
   ```bash
   sudo docker compose ps
   ```

2. **Check ports are listening:**
   ```bash
   sudo netstat -tulpn | grep -E '3000|3001'
   ```

3. **Check firewall:**
   - Ensure ports 3000 and 3001 are open
   - NAS firewall settings may block access

4. **Use NAS IP address:**
   - Don't use `localhost` from another machine
   - Use `http://your-nas-ip:3000`

## Database Issues

### Reset Database

**WARNING: This deletes all data!**

```bash
# Stop containers
sudo docker compose down

# Remove volume
sudo docker volume rm universotebook_postgres_data

# Start fresh
sudo docker compose up -d
sudo docker compose exec backend npm run db:generate
sudo docker compose exec backend npm run db:migrate
```

### Backup Database
```bash
sudo docker compose exec postgres pg_dump -U notebook_user codlabstudio > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
sudo docker compose exec -T postgres psql -U notebook_user codlabstudio < backup_20241205.sql
```

## Performance Issues

### Check Resource Usage
```bash
sudo docker stats
```

### Limit Resources (if needed)

Edit `docker-compose.yml` and add resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Still Having Issues?

1. Check all logs: `sudo docker compose logs`
2. Verify environment variables are set
3. Check disk space: `df -h`
4. Check Docker daemon: `sudo systemctl status docker`
5. Review error messages carefully


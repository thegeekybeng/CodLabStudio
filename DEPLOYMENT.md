# CodLabStudio - Deployment Guide

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed
- Domain name (optional, for SSL)
- SSL certificates (optional, for HTTPS)

### Environment Configuration

1. **Create production environment file:**

```bash
cp .env.example .env.prod
```

2. **Configure environment variables:**

```env
# Database
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=codlabstudio_prod
DATABASE_URL=postgresql://your_db_user:your_secure_password@postgres:5432/codlabstudio_prod

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_WS_URL=wss://your-domain.com

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EXECUTION_TIMEOUT_MS=30000
MAX_CODE_SIZE_BYTES=10485760
```

### Deployment Steps

1. **Build and start services:**

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

2. **Run database migrations:**

```bash
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

3. **Verify services are running:**

```bash
docker-compose -f docker-compose.prod.yml ps
```

4. **Check logs:**

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### SSL/HTTPS Configuration

1. **Obtain SSL certificates** (Let's Encrypt recommended):

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com
```

2. **Copy certificates to nginx/ssl:**

```bash
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/key.pem
sudo chmod 644 ./nginx/ssl/cert.pem
sudo chmod 600 ./nginx/ssl/key.pem
```

3. **Update nginx.conf** to enable HTTPS server block

4. **Restart nginx:**

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### Monitoring and Maintenance

**View logs:**

```bash
docker-compose -f docker-compose.prod.yml logs -f [service-name]
```

**Restart services:**

```bash
docker-compose -f docker-compose.prod.yml restart [service-name]
```

**Update application:**

```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

**Backup database:**

```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql
```

**Restore database:**

```bash
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB < backup.sql
```

### Security Checklist

- [ ] Strong JWT secrets (32+ characters, random)
- [ ] Strong database password
- [ ] HTTPS enabled with valid SSL certificates
- [ ] CORS_ORIGIN set to production domain
- [ ] Firewall configured (only necessary ports open)
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] Resource limits configured
- [ ] Audit logging enabled

### Scaling Considerations

For high-traffic deployments:

1. **Use managed database** (RDS, Cloud SQL) instead of containerized PostgreSQL
2. **Add load balancer** in front of backend services
3. **Use container orchestration** (Kubernetes) for auto-scaling
4. **Implement Redis** for session storage and caching
5. **Use CDN** for static assets
6. **Monitor resource usage** and adjust container limits

### Troubleshooting

**Services won't start:**

- Check environment variables
- Verify Docker daemon is running
- Check port conflicts

**Database connection errors:**

- Verify DATABASE_URL format
- Check PostgreSQL container is healthy
- Verify network connectivity

**Execution failures:**

- Check Docker socket is mounted
- Verify container resource limits
- Check execution logs

**WebSocket connection issues:**

- Verify NEXT_PUBLIC_WS_URL matches production URL
- Check nginx WebSocket proxy configuration
- Verify firewall allows WebSocket connections

# Troubleshooting Guides

This directory contains troubleshooting guides for common issues encountered during setup and deployment.

## Quick Reference

- **FIX_GUEST_MODE.md** - Fix guest mode and login issues
- **FIX_OPENSSL.md** - Resolve Prisma OpenSSL compatibility issues
- **FIX_MIGRATION.md** - Fix Prisma migration problems
- **FIX_PERMISSIONS.md** - Resolve PostgreSQL permission issues
- **DB_HEALTHCHECK_FIX.md** - Fix PostgreSQL healthcheck failures
- **PORT_CONFLICT_FIX.md** - Resolve port conflicts
- **REGISTRATION_FIX.md** - Fix registration/authentication issues
- **QUICK_FIX_BACKEND.md** - Quick backend troubleshooting
- **QUICK_FIX.md** - General quick fixes
- **MANUAL_SCHEMA_SETUP.md** - Manual database schema setup
- **REBUILD_WITH_DEBIAN.md** - Rebuild with Debian base image
- **NAS_TROUBLESHOOTING.md** - NAS-specific troubleshooting

## Common Issues

### Backend Won't Start
1. Check PostgreSQL is healthy: `sudo docker compose ps`
2. Check backend logs: `sudo docker compose logs backend`
3. See: QUICK_FIX_BACKEND.md

### Database Issues
1. Check PostgreSQL logs: `sudo docker compose logs postgres`
2. See: DB_HEALTHCHECK_FIX.md, FIX_PERMISSIONS.md

### Prisma Errors
1. See: FIX_MIGRATION.md, FIX_OPENSSL.md
2. Try: `sudo docker compose exec backend npm run db:generate`

### Port Conflicts
1. See: PORT_CONFLICT_FIX.md

### Authentication Issues
1. See: REGISTRATION_FIX.md, FIX_GUEST_MODE.md


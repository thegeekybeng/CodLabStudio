# Troubleshooting

This directory contains troubleshooting documentation and scripts organized by status.

## Structure

```
troubleshooting/
├── active/              # Current/ongoing issues
│   ├── documented-changes/    # Active troubleshooting documentation
│   └── scripted-fixes/        # Active troubleshooting scripts
└── archived/            # Resolved/completed issues (historical reference)
    ├── documented-changes/    # Past troubleshooting documentation
    └── scripted-fixes/        # Past troubleshooting scripts
```

## Active Troubleshooting

### Documented Changes

Current troubleshooting guides for active issues:

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

### Scripted Fixes

Automated scripts for active issues:

- **FINAL_FIX.sh** - Fix Prisma client generation issues

## Archived Troubleshooting

Resolved issues and historical troubleshooting documentation are maintained in `archived/` for reference.

## Maintenance

- **Active issues**: Keep current troubleshooting in `active/`
- **Resolved issues**: Move to `archived/` within 30 days of resolution
- **Review**: Monthly review of active troubleshooting folder
- **Cleanup**: Archive items older than 90 days unless actively referenced

See [.development-rules.md](../../.development-rules.md) for detailed organization standards.

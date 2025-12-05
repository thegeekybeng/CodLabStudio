# Scripts

This directory contains utility scripts for setup, troubleshooting, and testing.

## Structure

```
scripts/
├── setup/              # Setup and deployment scripts
│   ├── APPLY_CHANGES.sh    # Apply backend changes (admin seed, guest mode)
│   └── RUN_THIS_NOW.sh     # Quick setup script for initial deployment
└── utils/              # Testing and diagnostic scripts
    └── TEST_BACKEND.sh     # Test backend endpoints and connectivity
```

**Note:** Troubleshooting scripts have been moved to `docs/troubleshooting/scripted-fixes/` to be co-located with troubleshooting documentation.

## Usage

All scripts are designed to be run on your NAS or deployment server. They assume you're in the project directory.

### Setup Scripts

**APPLY_CHANGES.sh** - Apply backend changes (admin seeding, registration disable, guest mode)

```bash
cd /volume2/docker/UniversoteBook
bash scripts/setup/APPLY_CHANGES.sh
```

**RUN_THIS_NOW.sh** - Complete initial setup (database, containers, schema)

```bash
cd /volume2/docker/UniversoteBook
bash scripts/setup/RUN_THIS_NOW.sh
```

### Troubleshooting Scripts

**FINAL_FIX.sh** - Fix Prisma client generation and restart backend

```bash
cd /volume2/docker/UniversoteBook
bash scripts/troubleshooting/FINAL_FIX.sh
```

### Utility Scripts

**TEST_BACKEND.sh** - Test backend endpoints and connectivity

```bash
cd /volume2/docker/UniversoteBook
bash scripts/utils/TEST_BACKEND.sh
```

## Notes

- All scripts use `sudo` for Docker commands
- Scripts assume Docker Compose is available
- Paths are hardcoded for NAS deployment (`/volume2/docker/UniversoteBook`)
- Scripts include error handling and status messages

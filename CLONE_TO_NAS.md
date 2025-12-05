# Quick Guide: Clone CodLabStudio to NAS

## Step 1: Shut Down Old Universal Notebook

On your NAS (via SSH or terminal):

```bash
cd /volume2/docker/UniversoteBook  # or your old location
sudo docker compose down
```

## Step 2: Clone CodLabStudio

### Option A: Direct Clone (if Git is installed)

```bash
cd /volume2/docker
sudo git clone https://github.com/thegeekybeng/CodLabStudio.git
cd CodLabStudio
```

### Option B: Using Docker (if Git is not installed)

```bash
cd /volume2/docker
sudo docker run --rm -v /volume2/docker:/workspace -w /workspace alpine/git clone https://github.com/thegeekybeng/CodLabStudio.git
cd CodLabStudio
```

## Step 3: Run Migration Script

```bash
cd /volume2/docker/CodLabStudio
sudo bash scripts/setup/MIGRATE_TO_NAS.sh
```

The script will:
- Create `.env` file with secure passwords
- Set proper permissions
- Start Docker containers
- Perform health checks

## Step 4: Access CodLabStudio

Open in browser: `http://your-nas-ip:3000`

**Admin Login:**
- Email: `admin@codlabstudio.local`
- Password: `Admin@CodLabStudio2024!`

## Manual Setup (if script doesn't work)

1. **Create `.env` file:**
   ```bash
   cd /volume2/docker/CodLabStudio
   # Edit .env and set your NAS IP in CORS_ORIGIN, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
   ```

2. **Set permissions:**
   ```bash
   sudo chmod -R 755 database/init
   sudo mkdir -p repos && sudo chmod 777 repos
   ```

3. **Start services:**
   ```bash
   sudo docker compose up -d
   ```

## Troubleshooting

See `docs/setup/NAS_MIGRATION.md` for detailed troubleshooting.


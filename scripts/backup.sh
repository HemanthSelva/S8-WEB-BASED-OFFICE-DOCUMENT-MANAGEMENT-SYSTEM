#!/bin/bash

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/$TIMESTAMP"
DB_CONTAINER="intellidocx-postgres"
MINIO_VOLUME="minio_data"

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $TIMESTAMP..."

# 1. Backup PostgreSQL
echo "Backing up database..."
docker exec -t $DB_CONTAINER pg_dumpall -c -U postgres > "$BACKUP_DIR/db_dump.sql"

# 2. Backup MinIO (Simulated by copying volume data if possible, or using mc mirror)
# Note: In production, use 'mc' (MinIO Client) to mirror to another bucket.
# For local docker volume, we'll just note it.
echo "MinIO data should be backed up via volume snapshots or 'mc mirror'."

# 3. Compress
tar -czf "$BACKUP_DIR.tar.gz" -C "./backups" "$TIMESTAMP"
rm -rf "$BACKUP_DIR"

echo "Backup completed: $BACKUP_DIR.tar.gz"

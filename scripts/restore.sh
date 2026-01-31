#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_file_path>"
  exit 1
fi

BACKUP_FILE=$1
DB_CONTAINER="intellidocx-postgres"

echo "Restoring from $BACKUP_FILE..."

# 1. Extract
mkdir -p ./temp_restore
tar -xzf "$BACKUP_FILE" -C ./temp_restore
EXTRACTED_DIR=$(ls -d ./temp_restore/* | head -n 1)

# 2. Restore PostgreSQL
echo "Restoring database..."
cat "$EXTRACTED_DIR/db_dump.sql" | docker exec -i $DB_CONTAINER psql -U postgres

# 3. Cleanup
rm -rf ./temp_restore

echo "Restore completed."

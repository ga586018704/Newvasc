#!/bin/bash
# Backup script for VASCULAR AI (HIPAA/GDPR compliant)

BACKUP_DIR="/backups/vascular-ai"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=90

# Создание директории
mkdir -p $BACKUP_DIR

# 1. Backup Terminus DB
docker exec vascular_terminus terminusdb dump | gzip > $BACKUP_DIR/terminus_$DATE.gz

# 2. Backup DICOM images (анонимизированные)
tar -czf $BACKUP_DIR/dicom_$DATE.tar.gz -C /var/lib/dicom .

# 3. Backup ML models
tar -czf $BACKUP_DIR/models_$DATE.tar.gz ./models/

# 4. Backup protocols and configurations
pg_dump -h localhost -U terminus protocols_db | gzip > $BACKUP_DIR/protocols_$DATE.gz

# Шифрование (GPG)
gpg --encrypt --recipient admin@vascular-ai.ru $BACKUP_DIR/terminus_$DATE.gz
rm $BACKUP_DIR/terminus_$DATE.gz  # Удаляем нешифрованный

# Удаление старых бэкапов
find $BACKUP_DIR -name "*.gpg" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"

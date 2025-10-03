#!/bin/bash

# Скрипт резервного копирования базы данных CyberShield
# Использование: ./scripts/backup-db.sh

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Загружаем переменные окружения
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Файл .env не найден${NC}"
    exit 1
fi

# Создаем директорию для бэкапов если её нет
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Генерируем имя файла с датой и временем
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/cybershield_backup_$TIMESTAMP.sql"

echo -e "${BLUE}📦 Создание резервной копии базы данных...${NC}"

# Создаем бэкап
PGPASSWORD=secure_password_here pg_dump -h localhost -U pabit_user -d pabit_db > $BACKUP_FILE

if [ $? -eq 0 ]; then
    # Сжимаем бэкап
    gzip $BACKUP_FILE
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Получаем размер файла
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    
    echo -e "${GREEN}✅ Резервная копия создана успешно!${NC}"
    echo -e "${GREEN}📁 Файл: $BACKUP_FILE${NC}"
    echo -e "${GREEN}💾 Размер: $SIZE${NC}"
    
    # Удаляем старые бэкапы (старше 7 дней)
    find $BACKUP_DIR -name "cybershield_backup_*.sql.gz" -mtime +7 -delete
    echo -e "${BLUE}🧹 Удалены бэкапы старше 7 дней${NC}"
else
    echo -e "${RED}❌ Ошибка создания резервной копии${NC}"
    exit 1
fi

# Показываем список всех бэкапов
echo -e "\n${BLUE}📋 Доступные резервные копии:${NC}"
ls -lh $BACKUP_DIR/cybershield_backup_*.sql.gz 2>/dev/null | awk '{print $9, "("$5")"}'




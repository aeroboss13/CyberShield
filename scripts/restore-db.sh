#!/bin/bash

# Скрипт восстановления базы данных CyberShield
# Использование: ./scripts/restore-db.sh <backup_file>

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверяем аргументы
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Использование: $0 <backup_file>${NC}"
    echo -e "${BLUE}📋 Доступные резервные копии:${NC}"
    ls -lh ./backups/cybershield_backup_*.sql.gz 2>/dev/null | awk '{print "  "$9, "("$5")"}'
    exit 1
fi

BACKUP_FILE=$1

# Проверяем существование файла
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Файл $BACKUP_FILE не найден${NC}"
    exit 1
fi

# Загружаем переменные окружения
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Файл .env не найден${NC}"
    exit 1
fi

# Предупреждение
echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Это действие перезапишет текущую базу данных!${NC}"
read -p "Продолжить? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}❌ Отменено${NC}"
    exit 0
fi

echo -e "${BLUE}📦 Восстановление базы данных из $BACKUP_FILE...${NC}"

# Разархивируем если нужно
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${BLUE}📂 Распаковка архива...${NC}"
    gunzip -c $BACKUP_FILE > /tmp/restore_temp.sql
    SQL_FILE="/tmp/restore_temp.sql"
else
    SQL_FILE=$BACKUP_FILE
fi

# Останавливаем сервер
echo -e "${BLUE}🛑 Остановка сервера...${NC}"
pm2 stop cybershield

# Очищаем базу данных
echo -e "${BLUE}🗑️  Очистка текущей базы данных...${NC}"
PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Восстанавливаем из бэкапа
echo -e "${BLUE}📥 Восстановление данных...${NC}"
PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db < $SQL_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ База данных восстановлена успешно!${NC}"
    
    # Запускаем сервер
    echo -e "${BLUE}🚀 Запуск сервера...${NC}"
    pm2 start cybershield
    
    # Удаляем временный файл
    if [ -f "/tmp/restore_temp.sql" ]; then
        rm /tmp/restore_temp.sql
    fi
else
    echo -e "${RED}❌ Ошибка восстановления базы данных${NC}"
    pm2 start cybershield
    exit 1
fi

echo -e "${GREEN}🎉 Готово!${NC}"




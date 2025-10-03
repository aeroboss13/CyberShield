#!/bin/bash

# Полезные команды для работы с базой данных CyberShield
# Использование: source ./scripts/db-commands.sh

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для выполнения SQL команд
db_query() {
    PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db -c "$1"
}

# Функция для интерактивного подключения
db_connect() {
    echo -e "${BLUE}🔌 Подключение к базе данных...${NC}"
    PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db
}

# Функция для просмотра всех таблиц
db_tables() {
    echo -e "${BLUE}📋 Список таблиц:${NC}"
    db_query "\dt"
}

# Функция для просмотра структуры таблицы
db_describe() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Укажите название таблицы${NC}"
        echo "Использование: db_describe users"
        return 1
    fi
    echo -e "${BLUE}📊 Структура таблицы $1:${NC}"
    db_query "\d $1"
}

# Функция для просмотра пользователей
db_users() {
    echo -e "${BLUE}👥 Пользователи:${NC}"
    db_query "SELECT id, username, name, email, role, created_at FROM users ORDER BY id;"
}

# Функция для просмотра постов
db_posts() {
    echo -e "${BLUE}📝 Посты:${NC}"
    db_query "SELECT id, user_id, content, likes, comments, created_at FROM posts ORDER BY created_at DESC LIMIT 10;"
}

# Функция для просмотра CVE
db_cves() {
    echo -e "${BLUE}🔍 CVE уязвимости (последние 10):${NC}"
    db_query "SELECT id, cve_id, title, severity, published_date FROM cve_entries ORDER BY published_date DESC LIMIT 10;"
}

# Функция для просмотра статистики
db_stats() {
    echo -e "${BLUE}📊 Общая статистика:${NC}"
    echo ""
    echo "👥 Пользователи:"
    db_query "SELECT COUNT(*) as total_users, COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins FROM users;"
    echo ""
    echo "📝 Посты:"
    db_query "SELECT COUNT(*) as total_posts, SUM(likes) as total_likes, SUM(comments) as total_comments FROM posts;"
    echo ""
    echo "🔍 CVE:"
    db_query "SELECT COUNT(*) as total_cves, COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical FROM cve_entries;"
    echo ""
    echo "📰 Новости:"
    db_query "SELECT COUNT(*) as total_news FROM news_articles;"
}

# Функция для очистки базы данных (ОСТОРОЖНО!)
db_clean() {
    echo -e "${RED}⚠️  ВНИМАНИЕ: Это удалит ВСЕ данные!${NC}"
    read -p "Продолжить? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
        echo -e "${YELLOW}🗑️  Очистка базы данных...${NC}"
        db_query "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        echo -e "${GREEN}✅ База данных очищена${NC}"
    else
        echo -e "${BLUE}❌ Отменено${NC}"
    fi
}

# Функция для создания бэкапа
db_backup() {
    echo -e "${BLUE}📦 Создание резервной копии...${NC}"
    ./scripts/backup-db.sh
}

# Функция для восстановления из бэкапа
db_restore() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Укажите файл бэкапа${NC}"
        echo "Использование: db_restore ./backups/backup_file.sql.gz"
        return 1
    fi
    echo -e "${BLUE}🔄 Восстановление из бэкапа...${NC}"
    ./scripts/restore-db.sh "$1"
}

# Функция для показа помощи
db_help() {
    echo -e "${GREEN}🔧 Команды для работы с базой данных:${NC}"
    echo ""
    echo "📋 Основные команды:"
    echo "  db_connect          - Подключиться к базе данных"
    echo "  db_tables           - Показать все таблицы"
    echo "  db_describe <table> - Структура таблицы"
    echo "  db_users            - Показать пользователей"
    echo "  db_posts            - Показать посты"
    echo "  db_cves             - Показать CVE"
    echo "  db_stats            - Общая статистика"
    echo ""
    echo "🔄 Управление данными:"
    echo "  db_backup           - Создать бэкап"
    echo "  db_restore <file>   - Восстановить из бэкапа"
    echo "  db_clean            - Очистить базу (ОСТОРОЖНО!)"
    echo ""
    echo "📖 Примеры:"
    echo "  db_describe users"
    echo "  db_restore ./backups/backup_file.sql.gz"
    echo ""
    echo "💡 Для использования: source ./scripts/db-commands.sh"
}

# Показываем помощь при загрузке
echo -e "${GREEN}🔧 Команды базы данных загружены!${NC}"
echo -e "${BLUE}💡 Введите db_help для просмотра всех команд${NC}"



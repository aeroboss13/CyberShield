#!/bin/bash

# Скрипт для просмотра пользователей в базе данных CyberShield
# Использование: ./scripts/view-users.sh

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}👥 Пользователи в базе данных CyberShield${NC}"
echo ""

# Загружаем переменные окружения
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  Файл .env не найден, используем значения по умолчанию${NC}"
    export PGPASSWORD="secure_password_here"
fi

# Проверяем подключение к базе данных
echo -e "${BLUE}🔍 Проверка подключения к базе данных...${NC}"

# Получаем информацию о пользователях
PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db -c "
SELECT 
    id,
    username,
    name,
    email,
    role,
    CASE 
        WHEN created_at IS NOT NULL THEN to_char(created_at, 'DD.MM.YYYY HH24:MI')
        ELSE 'Не указано'
    END as created_at,
    reputation,
    post_count,
    likes_received,
    comments_count
FROM users 
ORDER BY id;
"

echo ""

# Получаем статистику
echo -e "${BLUE}📊 Статистика:${NC}"
PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db -c "
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
    SUM(post_count) as total_posts,
    SUM(likes_received) as total_likes,
    SUM(comments_count) as total_comments
FROM users;
"

echo ""

# Показываем последние регистрации
echo -e "${BLUE}🆕 Последние регистрации:${NC}"
PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db -c "
SELECT 
    username,
    name,
    to_char(created_at, 'DD.MM.YYYY HH24:MI') as registered
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
"

echo ""
echo -e "${GREEN}✅ Готово!${NC}"

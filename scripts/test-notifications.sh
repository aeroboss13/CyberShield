#!/bin/bash

# Скрипт для тестирования системы уведомлений
# Использование: ./scripts/test-notifications.sh

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔔 Тестирование системы уведомлений CyberShield${NC}"
echo ""

# Проверяем, что сервер запущен
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${RED}❌ Сервер не запущен. Запустите сервер сначала.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Сервер запущен${NC}"
echo ""

# Функция для отправки тестового уведомления
send_test_alert() {
    local type=$1
    local severity=$2
    local message=$3
    
    echo -e "${YELLOW}📤 Отправка тестового уведомления: $message${NC}"
    
    # Сначала нужно получить токен авторизации (это упрощенная версия)
    # В реальном сценарии нужно сначала залогиниться как админ
    
    response=$(curl -s -X POST http://localhost:5000/api/system/alert \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"$type\",\"severity\":\"$severity\",\"message\":\"$message\"}")
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Уведомление отправлено${NC}"
    else
        echo -e "${RED}❌ Ошибка отправки уведомления${NC}"
    fi
    echo ""
}

# Тестовые уведомления
echo -e "${BLUE}🧪 Отправка тестовых уведомлений...${NC}"
echo ""

# 1. Тест высокого использования CPU
send_test_alert "cpu" "warning" "⚠️ Высокая загрузка CPU: 75%"

# 2. Тест критического использования памяти
send_test_alert "memory" "critical" "🚨 КРИТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ ПАМЯТИ: 95%"

# 3. Тест переполнения диска
send_test_alert "disk" "critical" "🚨 КРИТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ ДИСКА: 98%"

# 4. Тест недоступности платформы
send_test_alert "platform" "critical" "🚨 Платформа CyberShield недоступна"

# 5. Тест нового пользователя (это будет отправлено автоматически при регистрации)
echo -e "${YELLOW}👤 Тест уведомления о новом пользователе:${NC}"
echo "Для тестирования зарегистрируйте нового пользователя через веб-интерфейс"
echo ""

# Проверяем уведомления в базе данных
echo -e "${BLUE}📋 Проверка уведомлений в базе данных:${NC}"
PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db -c "
SELECT 
    id,
    type,
    title,
    message,
    created_at,
    is_read
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
"

echo ""
echo -e "${GREEN}✅ Тестирование завершено!${NC}"
echo ""
echo -e "${BLUE}💡 Для просмотра уведомлений:${NC}"
echo "1. Откройте веб-интерфейс"
echo "2. Войдите как администратор"
echo "3. Проверьте раздел уведомлений"
echo ""
echo -e "${BLUE}🔧 Для мониторинга в реальном времени:${NC}"
echo "pm2 logs cybershield | grep -E 'Alert|notification|CPU|Memory|Disk'"

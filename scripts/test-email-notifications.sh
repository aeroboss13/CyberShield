#!/bin/bash

# Скрипт для тестирования email-уведомлений
# Использование: ./scripts/test-email-notifications.sh

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📧 Тестирование email-уведомлений CyberShield${NC}"
echo ""

# Проверяем, что сервер запущен
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${RED}❌ Сервер не запущен. Запустите сервер сначала.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Сервер запущен${NC}"
echo ""

# Проверяем настройки email
echo -e "${BLUE}🔧 Проверка настроек email:${NC}"
if grep -q "EMAIL_USER=p.bardin2017@yandex.ru" .env; then
    echo -e "${GREEN}✅ EMAIL_USER настроен${NC}"
else
    echo -e "${RED}❌ EMAIL_USER не настроен${NC}"
fi

if grep -q "EMAIL_PASS=" .env; then
    echo -e "${YELLOW}⚠️  EMAIL_PASS найден (проверьте пароль приложения)${NC}"
else
    echo -e "${RED}❌ EMAIL_PASS не настроен${NC}"
fi

echo ""

# Тест 1: Создание нового пользователя
echo -e "${BLUE}🧪 Тест 1: Создание нового пользователя${NC}"
echo "Создаю тестового пользователя для проверки email-уведомления..."

response=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"emailtest","email":"emailtest@example.com","password":"TestPassword123!","name":"Email Test User"}')

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Пользователь создан${NC}"
    echo "Проверьте почту p.bardin2017@yandex.ru на наличие уведомления о новом пользователе"
else
    echo -e "${RED}❌ Ошибка создания пользователя${NC}"
fi

echo ""

# Тест 2: Проверка логов email
echo -e "${BLUE}🧪 Тест 2: Проверка логов email${NC}"
echo "Проверяю логи сервера на наличие email-уведомлений..."

# Ждем немного для обработки
sleep 3

# Проверяем логи
if pm2 logs cybershield --nostream --lines 20 | grep -q "📧.*email sent"; then
    echo -e "${GREEN}✅ Email-уведомления отправляются${NC}"
    echo ""
    echo "Последние email-логи:"
    pm2 logs cybershield --nostream --lines 10 | grep -E "📧|Email|email" | tail -5
else
    echo -e "${YELLOW}⚠️  Email-уведомления не найдены в логах${NC}"
    echo "Возможные причины:"
    echo "1. EMAIL_PASS не настроен (нужен пароль приложения Yandex)"
    echo "2. Проблемы с SMTP подключением"
    echo "3. Email-сервис не инициализирован"
fi

echo ""

# Тест 3: Проверка уведомлений в БД (должны быть удалены)
echo -e "${BLUE}🧪 Тест 3: Проверка уведомлений в БД${NC}"
echo "Проверяю, что уведомления больше не сохраняются в БД..."

notification_count=$(PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db -c "SELECT COUNT(*) FROM notifications;" -t | xargs)

if [[ $notification_count -eq 0 ]]; then
    echo -e "${GREEN}✅ Уведомления больше не сохраняются в БД${NC}"
else
    echo -e "${YELLOW}⚠️  В БД найдено $notification_count уведомлений${NC}"
    echo "Это старые уведомления, новые должны отправляться только на email"
fi

echo ""

# Инструкции по настройке
echo -e "${BLUE}📋 Инструкции по настройке email:${NC}"
echo ""
echo "1. Для работы email-уведомлений нужен пароль приложения Yandex:"
echo "   • Зайдите в настройки Yandex ID"
echo "   • Включите двухфакторную аутентификацию"
echo "   • Создайте пароль приложения"
echo "   • Замените 'your_app_password_here' в .env на реальный пароль"
echo ""
echo "2. Перезапустите сервер после настройки:"
echo "   pm2 restart cybershield"
echo ""
echo "3. Проверьте почту p.bardin2017@yandex.ru на наличие уведомлений"
echo ""

echo -e "${GREEN}✅ Тестирование завершено!${NC}"
echo ""
echo -e "${BLUE}💡 Для мониторинга email-уведомлений:${NC}"
echo "pm2 logs cybershield | grep -E '📧|Email|email'"

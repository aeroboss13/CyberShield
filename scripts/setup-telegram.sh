#!/bin/bash

echo "🤖 Настройка Telegram уведомлений для CyberShield"
echo "=================================================="

# Проверка наличия curl
if ! command -v curl &> /dev/null; then
    echo "❌ curl не найден. Установите curl для работы с Telegram API."
    exit 1
fi

# Запрос токена бота
echo ""
echo "📝 Введите токен вашего Telegram бота:"
echo "   (Получить у @BotFather в Telegram)"
read -p "Bot Token: " BOT_TOKEN

if [[ -z "$BOT_TOKEN" ]]; then
    echo "❌ Токен бота не может быть пустым!"
    exit 1
fi

# Проверка токена
echo "🔍 Проверка токена..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
if echo "$BOT_INFO" | grep -q '"ok":true'; then
    BOT_NAME=$(echo "$BOT_INFO" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Токен валиден! Бот: @${BOT_NAME}"
else
    echo "❌ Неверный токен бота!"
    exit 1
fi

# Запрос Chat ID
echo ""
echo "📝 Введите ваш Chat ID:"
echo "   (Напишите боту сообщение, затем откройте: https://api.telegram.org/bot${BOT_TOKEN}/getUpdates)"
read -p "Chat ID: " CHAT_ID

if [[ -z "$CHAT_ID" ]]; then
    echo "❌ Chat ID не может быть пустым!"
    exit 1
fi

# Тест отправки сообщения
echo "🧪 Тестирование отправки сообщения..."
TEST_MESSAGE="🎉 CyberShield Telegram уведомления настроены! Время: $(date '+%Y-%m-%d %H:%M:%S')"
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d chat_id="${CHAT_ID}" \
    -d text="${TEST_MESSAGE}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Тестовое сообщение отправлено успешно!"
else
    echo "❌ Ошибка отправки сообщения:"
    echo "$RESPONSE"
    exit 1
fi

# Обновление конфигурационных файлов
echo "⚙️ Обновление конфигурационных файлов..."

# Обновление telegram-notify.sh
sed -i "s/TELEGRAM_BOT_TOKEN=\"YOUR_BOT_TOKEN_HERE\"/TELEGRAM_BOT_TOKEN=\"${BOT_TOKEN}\"/" /root/CyberShield/scripts/telegram-notify.sh
sed -i "s/TELEGRAM_CHAT_ID=\"YOUR_CHAT_ID_HERE\"/TELEGRAM_CHAT_ID=\"${CHAT_ID}\"/" /root/CyberShield/scripts/telegram-notify.sh

# Обновление pm2-telegram-monitor.sh
sed -i "s/TELEGRAM_BOT_TOKEN=\"YOUR_BOT_TOKEN_HERE\"/TELEGRAM_BOT_TOKEN=\"${BOT_TOKEN}\"/" /root/CyberShield/scripts/pm2-telegram-monitor.sh
sed -i "s/TELEGRAM_CHAT_ID=\"YOUR_CHAT_ID_HERE\"/TELEGRAM_CHAT_ID=\"${CHAT_ID}\"/" /root/CyberShield/scripts/pm2-telegram-monitor.sh

echo "✅ Конфигурационные файлы обновлены!"

# Запуск мониторинга через PM2
echo "🚀 Запуск мониторинга через PM2..."
pm2 start /root/CyberShield/scripts/pm2-telegram-monitor.sh --name "telegram-monitor"
pm2 save

echo ""
echo "🎉 Настройка завершена!"
echo "========================"
echo "📱 Telegram бот: @${BOT_NAME}"
echo "🆔 Chat ID: ${CHAT_ID}"
echo "🔍 Мониторинг: запущен через PM2"
echo ""
echo "📋 Полезные команды:"
echo "   pm2 status                    - статус процессов"
echo "   pm2 logs telegram-monitor     - логи мониторинга"
echo "   pm2 stop telegram-monitor     - остановить мониторинг"
echo "   pm2 restart telegram-monitor  - перезапустить мониторинг"
echo ""
echo "🧪 Тест уведомления:"
echo "   /root/CyberShield/scripts/telegram-notify.sh \"Тестовое сообщение\""
echo ""

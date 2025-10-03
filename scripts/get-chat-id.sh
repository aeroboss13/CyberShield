#!/bin/bash

echo "🔍 Получение Chat ID для бота @alertspabitbot"
echo "============================================="

BOT_TOKEN="8416198210:AAFclEO3hUMUYxGUEvFTqRCj5zPfJ7nnXyE"

echo "📝 Инструкция:"
echo "1. Откройте Telegram"
echo "2. Найдите бота @alertspabitbot"
echo "3. Напишите ему любое сообщение (например: 'Привет')"
echo "4. Нажмите Enter для проверки обновлений"
echo ""

read -p "Написали боту сообщение? Нажмите Enter для проверки..."

echo "🔍 Проверяем обновления..."
UPDATES=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates")

if echo "$UPDATES" | grep -q '"ok":true'; then
    echo "✅ API работает корректно"
    
    # Извлекаем Chat ID
    CHAT_IDS=$(echo "$UPDATES" | grep -o '"chat":{"id":[0-9]*' | grep -o '[0-9]*$' | sort -u)
    
    if [[ -n "$CHAT_IDS" ]]; then
        echo ""
        echo "📱 Найденные Chat ID:"
        for CHAT_ID in $CHAT_IDS; do
            echo "   Chat ID: $CHAT_ID"
        done
        
        # Берем первый (последний) Chat ID
        MAIN_CHAT_ID=$(echo "$CHAT_IDS" | tail -1)
        echo ""
        echo "🎯 Используем Chat ID: $MAIN_CHAT_ID"
        
        # Обновляем конфигурационные файлы
        echo "⚙️ Обновляем конфигурационные файлы..."
        
        sed -i "s/TELEGRAM_CHAT_ID=\"YOUR_CHAT_ID_HERE\"/TELEGRAM_CHAT_ID=\"${MAIN_CHAT_ID}\"/" /root/CyberShield/scripts/telegram-notify.sh
        sed -i "s/TELEGRAM_CHAT_ID=\"YOUR_CHAT_ID_HERE\"/TELEGRAM_CHAT_ID=\"${MAIN_CHAT_ID}\"/" /root/CyberShield/scripts/pm2-telegram-monitor.sh
        
        echo "✅ Конфигурация обновлена!"
        
        # Тест отправки сообщения
        echo "🧪 Отправляем тестовое сообщение..."
        TEST_MESSAGE="🎉 CyberShield уведомления настроены! Время: $(date '+%Y-%m-%d %H:%M:%S')"
        
        RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
            -d chat_id="${MAIN_CHAT_ID}" \
            -d text="${TEST_MESSAGE}")
        
        if echo "$RESPONSE" | grep -q '"ok":true'; then
            echo "✅ Тестовое сообщение отправлено успешно!"
            echo ""
            echo "🚀 Запускаем мониторинг через PM2..."
            pm2 start /root/CyberShield/scripts/pm2-telegram-monitor.sh --name "telegram-monitor"
            pm2 save
            
            echo ""
            echo "🎉 Настройка завершена!"
            echo "========================"
            echo "📱 Бот: @itt_news_bot"
            echo "🆔 Chat ID: ${MAIN_CHAT_ID}"
            echo "🔍 Мониторинг: запущен"
            echo ""
            echo "📋 Управление:"
            echo "   pm2 status                    - статус"
            echo "   pm2 logs telegram-monitor     - логи"
            echo "   pm2 stop telegram-monitor     - остановить"
        else
            echo "❌ Ошибка отправки тестового сообщения:"
            echo "$RESPONSE"
        fi
    else
        echo "❌ Chat ID не найден. Убедитесь, что вы написали боту сообщение."
        echo ""
        echo "📋 Полный ответ API:"
        echo "$UPDATES"
    fi
else
    echo "❌ Ошибка API:"
    echo "$UPDATES"
fi

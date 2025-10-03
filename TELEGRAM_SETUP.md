# Настройка Telegram уведомлений для CyberShield

## Шаг 1: Создание Telegram бота

1. Откройте Telegram и найдите бота [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям и создайте бота
4. Сохраните полученный токен (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Получение Chat ID

1. Напишите вашему боту любое сообщение
2. Откройте в браузере: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Найдите в ответе `"chat":{"id":123456789}` - это ваш Chat ID

## Шаг 3: Настройка конфигурации

Отредактируйте файлы:

### `/root/CyberShield/scripts/telegram-notify.sh`
```bash
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"  # Замените на ваш токен
TELEGRAM_CHAT_ID="YOUR_CHAT_ID_HERE"      # Замените на ваш Chat ID
```

### `/root/CyberShield/scripts/pm2-telegram-monitor.sh`
```bash
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"  # Замените на ваш токен
TELEGRAM_CHAT_ID="YOUR_CHAT_ID_HERE"      # Замените на ваш Chat ID
```

## Шаг 4: Запуск мониторинга

### Вариант 1: Ручной запуск
```bash
# Запуск мониторинга в фоне
nohup /root/CyberShield/scripts/pm2-telegram-monitor.sh > /dev/null 2>&1 &
```

### Вариант 2: Через PM2 (рекомендуется)
```bash
# Добавить в PM2
pm2 start /root/CyberShield/scripts/pm2-telegram-monitor.sh --name "telegram-monitor"

# Сохранить конфигурацию PM2
pm2 save
pm2 startup
```

## Шаг 5: Тестирование

### Тест отправки сообщения:
```bash
/root/CyberShield/scripts/telegram-notify.sh "Тестовое сообщение от CyberShield"
```

### Тест системного алерта:
```bash
# Создать тестового пользователя для проверки уведомления
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'
```

## Типы уведомлений

Система будет отправлять следующие уведомления:

1. **🚨 Критические ошибки** - фатальные ошибки, таймауты соединений
2. **⚠️ Системные алерты** - высокая загрузка CPU/памяти/диска
3. **👤 Новые пользователи** - регистрация новых пользователей
4. **🖥️ Статус платформы** - изменения статуса (онлайн/офлайн/деградация)

## Мониторинг

Проверить статус мониторинга:
```bash
# Проверить PM2 процессы
pm2 status

# Проверить логи мониторинга
pm2 logs telegram-monitor

# Остановить мониторинг
pm2 stop telegram-monitor
```

## Устранение неполадок

### Бот не отвечает:
1. Проверьте правильность токена
2. Убедитесь, что написали боту сообщение
3. Проверьте правильность Chat ID

### Уведомления не приходят:
1. Проверьте интернет-соединение
2. Убедитесь, что скрипт запущен
3. Проверьте логи: `pm2 logs telegram-monitor`

### Проверка подключения:
```bash
# Тест API Telegram
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

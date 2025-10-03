# 🔔 Система мониторинга и уведомлений CyberShield

## 📋 Обзор

Система мониторинга CyberShield автоматически отслеживает состояние платформы и отправляет уведомления администраторам при возникновении проблем.

## 🚨 Типы уведомлений

### 1. **Системные уведомления**
- **Высокая загрузка CPU** (≥70%)
- **Критическая загрузка CPU** (≥90%)
- **Высокое использование памяти** (≥80%)
- **Критическое использование памяти** (≥95%)
- **Высокое использование диска** (≥85%)
- **Критическое использование диска** (≥95%)

### 2. **Пользовательские уведомления**
- **Новый пользователь** - автоматически при регистрации
- **Статус платформы** - онлайн/офлайн/снижена производительность

### 3. **Ручные уведомления**
- Администраторы могут отправлять уведомления через API

## ⚙️ Настройки мониторинга

### Пороги предупреждений:
```typescript
{
  cpuWarning: 70,        // Предупреждение CPU
  cpuCritical: 90,       // Критический CPU
  memoryWarning: 80,     // Предупреждение памяти
  memoryCritical: 95,    // Критическая память
  diskWarning: 85,       // Предупреждение диска
  diskCritical: 95       // Критический диск
}
```

### Интервал проверки:
- **По умолчанию**: 60 секунд (1 минута)
- **Настраивается** в `monitoring-service.ts`

### Кулдаун уведомлений:
- **5 минут** между одинаковыми уведомлениями
- Предотвращает спам при постоянных проблемах

## 🔧 API Endpoints

### Получение системных метрик
```http
GET /api/system/metrics
Authorization: Bearer <admin_token>
```

**Ответ:**
```json
{
  "cpuUsage": 45.2,
  "memoryUsage": 67.8,
  "diskUsage": 23.1,
  "uptime": 86400,
  "loadAverage": [1.2, 1.5, 1.8],
  "activeConnections": 12,
  "databaseConnections": 3
}
```

### Отправка ручного уведомления
```http
POST /api/system/alert
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "type": "custom",
  "severity": "warning",
  "message": "Плановое обслуживание в 02:00"
}
```

## 📊 Мониторинг в реальном времени

### Просмотр логов мониторинга:
```bash
pm2 logs cybershield | grep -E 'Alert|notification|CPU|Memory|Disk'
```

### Просмотр системных метрик:
```bash
pm2 logs cybershield | grep 'System Metrics'
```

### Пример вывода:
```
📊 System Metrics: {
  cpu: "45.2%",
  memory: "67.8%", 
  disk: "23.1%",
  uptime: "24h",
  connections: 12
}
```

## 🧪 Тестирование системы

### Автоматический тест:
```bash
./scripts/test-notifications.sh
```

### Ручное тестирование:
1. **Создать тестового пользователя:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"Test123!","name":"Test User"}'
   ```

2. **Проверить уведомления в БД:**
   ```bash
   PGPASSWORD=secure_password_here psql -h localhost -U pabit_user -d pabit_db -c "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;"
   ```

## 👥 Получатели уведомлений

### Автоматические уведомления получают:
- **Все пользователи с ролью `admin`**
- **Уведомления сохраняются в базе данных**
- **Доступны через веб-интерфейс**

### Создание администратора:
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

## 🔍 Структура уведомлений

### Таблица `notifications`:
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,           -- 'system_alert', 'new_user', 'platform_status'
  title TEXT NOT NULL,          -- Заголовок уведомления
  message TEXT NOT NULL,        -- Текст уведомления
  is_read BOOLEAN DEFAULT false,
  related_id INTEGER,           -- ID связанного объекта
  related_type TEXT,            -- Тип связанного объекта
  from_user_id INTEGER,         -- ID отправителя (для системных = NULL)
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📱 Веб-интерфейс

### Просмотр уведомлений:
1. Войдите как администратор
2. Откройте раздел уведомлений
3. Просматривайте системные и пользовательские уведомления

### API для фронтенда:
```http
GET /api/notifications          # Получить уведомления
GET /api/notifications/count    # Количество непрочитанных
PATCH /api/notifications/:id/read # Отметить как прочитанное
DELETE /api/notifications/:id   # Удалить уведомление
```

## 🚀 Запуск и остановка

### Автоматический запуск:
- Мониторинг запускается автоматически при старте сервера
- Логи: `✅ Platform monitoring service started`

### Ручное управление:
```typescript
// Запуск мониторинга
await monitoringService.startMonitoring(60000);

// Остановка мониторинга
monitoringService.stopMonitoring();
```

## 🔧 Настройка и кастомизация

### Изменение порогов:
Отредактируйте `server/services/monitoring-service.ts`:
```typescript
private readonly thresholds: AlertThresholds = {
  cpuWarning: 70,      // Измените на нужное значение
  cpuCritical: 90,
  memoryWarning: 80,
  memoryCritical: 95,
  diskWarning: 85,
  diskCritical: 95
};
```

### Изменение интервала проверки:
```typescript
await monitoringService.startMonitoring(30000); // 30 секунд
```

### Добавление новых типов уведомлений:
1. Добавьте новый тип в `sendAlert()`
2. Обновите логику в `evaluateAlerts()`
3. Добавьте соответствующий API endpoint

## 📈 Метрики и аналитика

### Отслеживаемые метрики:
- **CPU Usage** - загрузка процессора
- **Memory Usage** - использование оперативной памяти
- **Disk Usage** - использование дискового пространства
- **Uptime** - время работы сервера
- **Load Average** - средняя нагрузка системы
- **Active Connections** - активные соединения
- **Database Connections** - соединения с БД

### Логирование:
- Все уведомления логируются в консоль
- Метрики выводятся каждые 5 минут
- Ошибки мониторинга записываются в error.log

## 🛠️ Устранение неполадок

### Мониторинг не запускается:
1. Проверьте логи: `pm2 logs cybershield`
2. Убедитесь, что PostgreSQL доступен
3. Проверьте права доступа к системным командам

### Уведомления не отправляются:
1. Проверьте наличие администраторов в БД
2. Убедитесь, что таблица `notifications` существует
3. Проверьте логи на ошибки

### Высокое потребление ресурсов:
1. Увеличьте интервал проверки
2. Оптимизируйте запросы к БД
3. Добавьте фильтрацию метрик

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `pm2 logs cybershield`
2. Запустите тест: `./scripts/test-notifications.sh`
3. Проверьте статус БД: `./scripts/view-users.sh`

---

**Создано**: 3 октября 2025  
**Версия**: 1.0.0  
**Статус**: ✅ Активно работает

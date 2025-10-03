# 🗄️ База данных CyberShield

## Обзор

CyberShield использует **PostgreSQL** для хранения всех данных пользователей, постов, комментариев и других сущностей. Данные сохраняются между перезагрузками сервера.

## Подключение

База данных настраивается через переменную окружения в файле `.env`:

```bash
DATABASE_URL=postgresql://pabit_user:secure_password_here@localhost:5432/pabit_db
```

## Структура таблиц

### Основные таблицы:
- **users** - Пользователи системы
- **posts** - Посты в социальной ленте
- **post_comments** - Комментарии к постам
- **post_likes** - Лайки постов
- **cve_entries** - CVE уязвимости (кэш из NVD)
- **exploits** - Эксплойты из ExploitDB
- **mitre_attack** - Данные MITRE ATT&CK
- **news_articles** - Новости безопасности (кэш)
- **news_comments** - Комментарии к новостям
- **news_likes** - Лайки новостей
- **user_submissions** - Пользовательские материалы
- **notifications** - Уведомления пользователей

## 📦 Резервное копирование

### Создание резервной копии

```bash
./scripts/backup-db.sh
```

Резервные копии сохраняются в директории `./backups/` с именем формата:
```
cybershield_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Автоматическое резервное копирование

Резервное копирование настроено через cron и выполняется **каждый день в 3:00 ночи**.

Проверить статус:
```bash
crontab -l | grep backup-db
```

Старые бэкапы (>7 дней) автоматически удаляются.

## 🔄 Восстановление базы данных

### Из резервной копии

```bash
./scripts/restore-db.sh ./backups/cybershield_backup_YYYYMMDD_HHMMSS.sql.gz
```

⚠️ **ВНИМАНИЕ**: Эта операция полностью заменит текущие данные!

### Список доступных бэкапов

```bash
ls -lh ./backups/
```

## 🔧 Управление базой данных

### Подключение к PostgreSQL

```bash
psql -h localhost -U pabit_user -d pabit_db
```

Пароль: `secure_password_here`

### Полезные SQL-команды

```sql
-- Список всех таблиц
\dt

-- Количество пользователей
SELECT COUNT(*) FROM users;

-- Последние зарегистрированные пользователи
SELECT id, username, name, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- Статистика по постам
SELECT COUNT(*) as total_posts, SUM(likes) as total_likes FROM posts;

-- Размер базы данных
SELECT pg_size_pretty(pg_database_size('pabit_db'));

-- Размер каждой таблицы
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔄 Миграции

### Создание новой миграции

```bash
npm run db:generate
```

### Применение миграций

```bash
npm run db:push
```

### Откат миграции

Drizzle ORM не поддерживает автоматический откат. Используйте резервную копию для восстановления.

## 🛡️ Безопасность

1. **Регулярные бэкапы**: Автоматически каждый день
2. **Хранение паролей**: Bcrypt с 10 раундами хеширования
3. **Сессии**: Хранятся в PostgreSQL (безопаснее чем в памяти)
4. **Изоляция**: База работает только на localhost

## 📊 Мониторинг

### Активные подключения

```sql
SELECT count(*) FROM pg_stat_activity;
```

### Долгие запросы

```sql
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### Размер кэша

```sql
SELECT 
    SUM(heap_blks_read) as heap_read,
    SUM(heap_blks_hit)  as heap_hit,
    SUM(heap_blks_hit) / (SUM(heap_blks_hit) + SUM(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

## 🚨 Решение проблем

### База данных не запускается

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Проблемы с подключением

Проверьте:
1. PostgreSQL запущен: `sudo systemctl status postgresql`
2. Правильные credentials в `.env`
3. База данных создана: `psql -l | grep pabit_db`

### Восстановление после сбоя

1. Остановите сервер: `pm2 stop cybershield`
2. Восстановите из бэкапа: `./scripts/restore-db.sh ./backups/latest.sql.gz`
3. Запустите сервер: `pm2 start cybershield`

## 📈 Оптимизация

### Vacuum (очистка)

```sql
VACUUM ANALYZE;
```

### Переиндексация

```sql
REINDEX DATABASE pabit_db;
```

### Обновление статистики

```sql
ANALYZE;
```

## 🔗 Полезные ссылки

- [Документация PostgreSQL](https://www.postgresql.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Миграции](./migrations/)




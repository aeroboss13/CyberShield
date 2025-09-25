# 🚀 Инструкция развертывания Pabit на сервере

## Системные требования
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+ 
- PostgreSQL 13+
- Nginx (рекомендуется)
- PM2 для управления процессами
- Минимум 2GB RAM, 20GB дисковое пространство

## 1. Подготовка сервера

### Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### Установка Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Установка PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Установка Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Установка PM2
```bash
sudo npm install -g pm2
```

## 2. Настройка базы данных

### Создание пользователя и БД
```bash
sudo -u postgres psql
```

```sql
CREATE USER pabit_user WITH PASSWORD 'secure_password_here';
CREATE DATABASE pabit_db OWNER pabit_user;
GRANT ALL PRIVILEGES ON DATABASE pabit_db TO pabit_user;
\q
```

### Настройка доступа (опционально для удаленного доступа)
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
# Раскомментировать: listen_addresses = 'localhost'

sudo nano /etc/postgresql/*/main/pg_hba.conf  
# Добавить: local pabit_db pabit_user md5
```

```bash
sudo systemctl restart postgresql
```

## 3. Развертывание приложения

### Клонирование проекта
```bash
cd /var/www
sudo mkdir pabit
sudo chown $USER:$USER pabit
cd pabit

# Скопировать все файлы проекта сюда
# или клонировать из Git:
# git clone <your-repo-url> .
```

### Установка зависимостей
```bash
npm install
```

### Настройка переменных окружения
```bash
nano .env
```

Добавить в `.env`:
```env
# База данных
DATABASE_URL=postgresql://pabit_user:secure_password_here@localhost:5432/pabit_db

# Секреты
SESSION_SECRET=your_very_long_random_session_secret_here_32_chars_min
ADMIN_CODE=SECHUB_ADMIN_2025

# Приложение
NODE_ENV=production
PORT=5000

# Опционально - для внешних API
# CVE_API_KEY=your_cve_api_key
# NEWS_API_KEY=your_news_api_key
```

### Создание пользователя для приложения
```bash
sudo useradd -r -s /bin/false pabit-app
sudo chown -R pabit-app:pabit-app /var/www/pabit
```

## 4. Сборка проекта

### Сборка фронтенда и бэкенда
```bash
npm run build
```

### Проверка структуры после сборки
```bash
ls -la dist/
# Должно быть:
# dist/
#   ├── index.js (собранный сервер)  
#   └── public/ (фронтенд)
#       ├── index.html
#       ├── assets/
#       └── ...
```

### Применение миграций БД
```bash
npm run db:push
```

## 5. Настройка PM2

### Создание конфигурации PM2
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'pabit',
    script: 'dist/index.js',
    cwd: '/var/www/pabit',
    user: 'pabit-app',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pabit/error.log',
    out_file: '/var/log/pabit/out.log',
    log_file: '/var/log/pabit/combined.log',
    time: true
  }]
};
```

### Создание директории для логов
```bash
sudo mkdir -p /var/log/pabit
sudo chown pabit-app:pabit-app /var/log/pabit
```

### Запуск через PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Выполнить команду, которую покажет PM2 startup
```

## 6. Настройка Nginx

### Создание конфигурации сайта
```bash
sudo nano /etc/nginx/sites-available/pabit
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Основное приложение
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Статические файлы
    location /assets/ {
        alias /var/www/pabit/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Лимиты загрузки (для аватаров)
    client_max_body_size 10M;
    
    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### Активация сайта
```bash
sudo ln -s /etc/nginx/sites-available/pabit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7. SSL сертификат (Let's Encrypt)

### Установка Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Получение сертификата
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Автообновление сертификата
```bash
sudo crontab -e
# Добавить:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 8. Настройка файрвола

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp  
sudo ufw allow 443/tcp
sudo ufw enable
```

## 9. Мониторинг и обслуживание

### Проверка статуса
```bash
# PM2 статус
pm2 status
pm2 logs pabit

# Nginx статус
sudo systemctl status nginx

# PostgreSQL статус  
sudo systemctl status postgresql

# Использование ресурсов
pm2 monit
```

### Логи приложения
```bash
# PM2 логи
pm2 logs pabit --lines 100

# Системные логи
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

### Резервное копирование БД
```bash
# Создание бэкапа
sudo -u postgres pg_dump pabit_db > /backups/pabit_$(date +%Y%m%d_%H%M%S).sql

# Автоматический бэкап (cron)
sudo crontab -e
# Добавить:
0 2 * * * sudo -u postgres pg_dump pabit_db > /backups/pabit_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

## 10. Обновление приложения

### Скрипт обновления
```bash
nano update-pabit.sh
```

```bash
#!/bin/bash
cd /var/www/pabit

# Остановка приложения
pm2 stop pabit

# Обновление кода (если из Git)
# git pull origin main

# Обновление зависимостей
npm install

# Новая сборка
npm run build

# Миграции БД
npm run db:push

# Запуск приложения  
pm2 start pabit

echo "Pabit updated successfully!"
```

```bash
chmod +x update-pabit.sh
```

## 11. Устранение проблем

### Частые проблемы:

**1. Приложение не запускается**
```bash
pm2 logs pabit
# Проверить .env файл
# Проверить права доступа к файлам
```

**2. База данных недоступна**
```bash
sudo systemctl status postgresql
# Проверить DATABASE_URL в .env
# Проверить права пользователя БД
```

**3. Nginx 502 ошибка**
```bash
sudo nginx -t
sudo systemctl status nginx
pm2 status
# Проверить что приложение запущено на порту 5000
```

**4. Проблемы с сертификатом**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## 12. Безопасность

### Дополнительные меры безопасности:
- Регулярно обновляйте систему: `sudo apt update && sudo apt upgrade`
- Используйте fail2ban для защиты от брутфорса
- Настройте мониторинг логов
- Регулярно меняйте SESSION_SECRET
- Используйте сильные пароли для БД
- Ограничьте доступ к серверу по SSH ключам

### Monitoring (опционально)
Рассмотрите установку:
- Grafana + Prometheus для мониторинга
- ELK Stack для анализа логов
- Uptime мониторинг

## ✅ Результат

После выполнения всех шагов у вас будет:
- Pabit запущен на https://your-domain.com
- Автоматические перезапуски через PM2
- SSL сертификат с автообновлением
- Резервное копирование БД
- Мониторинг логов и статуса

**Первый вход:**
1. Перейдите на https://your-domain.com
2. Зарегистрируйтесь как пользователь
3. Получите права админа с кодом: `SECHUB_ADMIN_2025`
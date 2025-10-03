import * as nodemailer from 'nodemailer';

async function sendTestEmail() {
  try {
    console.log('📧 Настройка email-транспорта...');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 587,
      secure: false,
      auth: {
        user: 'p.bardin2017@yandex.ru',
        pass: 'kaexmikoplovpsux'
      }
    });

    console.log('📤 Отправка тестового email...');
    
    const result = await transporter.sendMail({
      from: '"CyberShield Monitor" <p.bardin2017@yandex.ru>',
      to: 'p.bardin2017@yandex.ru',
      subject: '🧪 Тестовое уведомление CyberShield - Email работает!',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Тестовое уведомление CyberShield</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .test-info { background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #10b981; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ CyberShield</h1>
            <p>Тестовое уведомление</p>
        </div>
        
        <div class="content">
            <div class="test-info">
                <h2>🧪 Тестовое уведомление</h2>
                <p><strong>Статус:</strong> ✅ Email-уведомления работают!</p>
                <p><strong>Тип:</strong> Тестовое сообщение</p>
                <p><strong>Описание:</strong> Это тестовое уведомление для проверки работы email-системы CyberShield</p>
            </div>
            
            <h3>📧 Что работает:</h3>
            <ul>
                <li>✅ SMTP подключение к Yandex</li>
                <li>✅ Отправка HTML-писем</li>
                <li>✅ Красивые шаблоны уведомлений</li>
                <li>✅ Автоматические уведомления о новых пользователях</li>
                <li>✅ Системные алерты (CPU, память, диск)</li>
                <li>✅ Уведомления о статусе платформы</li>
            </ul>
            
            <p><strong>Время отправки:</strong> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</p>
        </div>
        
        <div class="footer">
            <p>Это тестовое уведомление от системы CyberShield</p>
            <p>Email-уведомления настроены и работают корректно!</p>
        </div>
    </div>
</body>
</html>`,
      text: 'Тестовое уведомление CyberShield - Email-система работает корректно!'
    });

    console.log('✅ Email отправлен успешно!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📧 Получатель: p.bardin2017@yandex.ru');
    console.log('📧 Тема: Тестовое уведомление CyberShield - Email работает!');
    
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error.message);
  }
}

// Запускаем отправку
sendTestEmail();

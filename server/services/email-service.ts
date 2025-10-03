import * as nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Настройка для Gmail/Yandex
      this.transporter = nodemailer.createTransport({
        host: 'smtp.yandex.ru',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER || 'p.bardin2017@yandex.ru',
          pass: process.env.EMAIL_PASS || 'your_app_password' // Нужен пароль приложения
        }
      });

      // Проверяем подключение
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  public async sendEmail(notification: EmailNotification): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('❌ Email service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `"CyberShield Monitor" <${process.env.EMAIL_USER || 'p.bardin2017@yandex.ru'}>`,
        to: notification.to,
        subject: notification.subject,
        html: notification.html,
        text: notification.text || this.htmlToText(notification.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  public async sendSystemAlert(
    type: 'cpu' | 'memory' | 'disk' | 'platform',
    severity: 'warning' | 'critical',
    message: string,
    metrics?: any
  ): Promise<boolean> {
    const subject = `🚨 CyberShield Alert: ${severity.toUpperCase()} - ${type.toUpperCase()}`;
    
    const html = this.generateSystemAlertHTML(type, severity, message, metrics);
    
    return this.sendEmail({
      to: 'p.bardin2017@yandex.ru',
      subject,
      html
    });
  }

  public async sendNewUserNotification(username: string, email: string): Promise<boolean> {
    const subject = '👤 Новый пользователь зарегистрирован в CyberShield';
    
    const html = this.generateNewUserHTML(username, email);
    
    return this.sendEmail({
      to: 'p.bardin2017@yandex.ru',
      subject,
      html
    });
  }

  public async sendPlatformStatusNotification(status: 'online' | 'offline' | 'degraded'): Promise<boolean> {
    const subject = `🔧 Статус платформы CyberShield: ${status.toUpperCase()}`;
    
    const html = this.generatePlatformStatusHTML(status);
    
    return this.sendEmail({
      to: 'p.bardin2017@yandex.ru',
      subject,
      html
    });
  }

  private generateSystemAlertHTML(type: string, severity: string, message: string, metrics?: any): string {
    const severityColor = severity === 'critical' ? '#dc2626' : '#f59e0b';
    const severityIcon = severity === 'critical' ? '🚨' : '⚠️';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CyberShield Alert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert { background: ${severityColor}; color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .metrics { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px; }
        .timestamp { color: #666; font-size: 12px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ CyberShield</h1>
            <p>Система мониторинга платформы</p>
        </div>
        
        <div class="content">
            <div class="alert">
                <h2>${severityIcon} ${severity.toUpperCase()} ALERT</h2>
                <p><strong>Тип:</strong> ${type.toUpperCase()}</p>
                <p><strong>Сообщение:</strong> ${message}</p>
            </div>
            
            ${metrics ? `
            <div class="metrics">
                <h3>📊 Системные метрики:</h3>
                <ul>
                    <li><strong>CPU:</strong> ${metrics.cpuUsage?.toFixed(1) || 'N/A'}%</li>
                    <li><strong>Память:</strong> ${metrics.memoryUsage?.toFixed(1) || 'N/A'}%</li>
                    <li><strong>Диск:</strong> ${metrics.diskUsage?.toFixed(1) || 'N/A'}%</li>
                    <li><strong>Время работы:</strong> ${Math.floor(metrics.uptime / 3600)}h</li>
                    <li><strong>Соединения:</strong> ${metrics.activeConnections || 0}</li>
                </ul>
            </div>
            ` : ''}
            
            <div class="timestamp">
                Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
            </div>
        </div>
        
        <div class="footer">
            <p>Это автоматическое уведомление от системы мониторинга CyberShield</p>
            <p>Не отвечайте на это письмо</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateNewUserHTML(username: string, email: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Новый пользователь CyberShield</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .user-info { background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #10b981; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px; }
        .timestamp { color: #666; font-size: 12px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ CyberShield</h1>
            <p>Новый пользователь зарегистрирован</p>
        </div>
        
        <div class="content">
            <div class="user-info">
                <h2>👤 Новый пользователь</h2>
                <p><strong>Имя пользователя:</strong> ${username}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Статус:</strong> Активен</p>
            </div>
            
            <div class="timestamp">
                Время регистрации: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
            </div>
        </div>
        
        <div class="footer">
            <p>Это автоматическое уведомление от системы CyberShield</p>
            <p>Не отвечайте на это письмо</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generatePlatformStatusHTML(status: string): string {
    const statusConfig = {
      online: { color: '#059669', icon: '✅', text: 'Платформа работает в штатном режиме' },
      offline: { color: '#dc2626', icon: '🚨', text: 'Платформа недоступна или не отвечает' },
      degraded: { color: '#f59e0b', icon: '⚠️', text: 'Платформа работает с ограничениями' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Статус платформы CyberShield</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .status { background: ${config.color}; color: white; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px; }
        .timestamp { color: #666; font-size: 12px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ CyberShield</h1>
            <p>Статус платформы</p>
        </div>
        
        <div class="content">
            <div class="status">
                <h2>${config.icon} ${status.toUpperCase()}</h2>
                <p>${config.text}</p>
            </div>
            
            <div class="timestamp">
                Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
            </div>
        </div>
        
        <div class="footer">
            <p>Это автоматическое уведомление от системы мониторинга CyberShield</p>
            <p>Не отвечайте на это письмо</p>
        </div>
    </div>
</body>
</html>`;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  public isReady(): boolean {
    return this.isConfigured;
  }
}

export const emailService = EmailService.getInstance();

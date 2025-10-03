import { storage } from '../storage.js';
// Email service disabled - using PM2 notifications instead
// import { emailService } from './real-email-service.js';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: number;
  loadAverage: number[];
  activeConnections: number;
  databaseConnections: number;
}

export interface AlertThresholds {
  cpuWarning: number;
  cpuCritical: number;
  memoryWarning: number;
  memoryCritical: number;
  diskWarning: number;
  diskCritical: number;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastAlertTimes: Map<string, number> = new Map();
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  private readonly thresholds: AlertThresholds = {
    cpuWarning: 70,
    cpuCritical: 90,
    memoryWarning: 90,
    memoryCritical: 95,
    diskWarning: 85,
    diskCritical: 95
  };

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async startMonitoring(intervalMs: number = 60000): Promise<void> {
    console.log('🔍 Starting platform monitoring service...');
    console.log('📱 Using PM2 notifications instead of email');
    
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        console.error('❌ Monitoring check failed:', error);
      }
    }, intervalMs);

    // Initial check
    await this.checkSystemHealth();
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Platform monitoring stopped');
    }
  }

  private async checkSystemHealth(): Promise<void> {
    const metrics = await this.getSystemMetrics();
    await this.evaluateAlerts(metrics);
    
    // Check HTTP availability
    const httpAvailable = await this.checkHttpAvailability();
    if (!httpAvailable) {
      await this.sendAlert('http', 'critical', '🚨 ВЕБ-СЕРВЕР НЕДОСТУПЕН! Платформа не отвечает на HTTP-запросы');
    }
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    const cpuUsage = await this.getCpuUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();
    const uptime = os.uptime();
    const loadAverage = os.loadavg();
    const activeConnections = await this.getActiveConnections();
    const databaseConnections = await this.getDatabaseConnections();

    return {
      cpuUsage,
      memoryUsage,
      diskUsage,
      uptime,
      loadAverage,
      activeConnections,
      databaseConnections
    };
  }

  private async checkHttpAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('HTTP availability check failed:', error);
      return false;
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        
        const totalUsage = endUsage.user + endUsage.system;
        const totalTime = (endTime - startTime) * 1000; // Convert to microseconds
        
        const cpuPercent = (totalUsage / totalTime) * 100;
        resolve(Math.min(cpuPercent, 100));
      }, 1000);
    });
  }

  private getMemoryUsage(): number {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return (usedMemory / totalMemory) * 100;
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const { stdout } = await execAsync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'");
      return parseFloat(stdout.trim()) || 0;
    } catch (error) {
      console.error('Failed to get disk usage:', error);
      return 0;
    }
  }

  private async getActiveConnections(): Promise<number> {
    try {
      const { stdout } = await execAsync("netstat -an | grep :5000 | grep ESTABLISHED | wc -l");
      return parseInt(stdout.trim()) || 0;
    } catch (error) {
      console.error('Failed to get active connections:', error);
      return 0;
    }
  }

  private async getDatabaseConnections(): Promise<number> {
    try {
      // This would need to be implemented based on your database connection pool
      // For now, return a placeholder
      return 0;
    } catch (error) {
      console.error('Failed to get database connections:', error);
      return 0;
    }
  }

  private async evaluateAlerts(metrics: SystemMetrics): Promise<void> {
    const alerts: Array<{ type: string; severity: 'warning' | 'critical'; message: string }> = [];

    // Only send memory alerts (>= 90%) - other alerts are filtered out
    if (metrics.memoryUsage >= this.thresholds.memoryWarning) {
      alerts.push({
        type: 'memory',
        severity: metrics.memoryUsage >= this.thresholds.memoryCritical ? 'critical' : 'warning',
        message: `⚠️ Высокое использование памяти: ${metrics.memoryUsage.toFixed(1)}%`
      });
    }

    // Send only memory alerts
    for (const alert of alerts) {
      await this.sendAlert(alert.type, alert.severity, alert.message);
    }

    // Log metrics every 5 minutes (but don't send to Telegram)
    if (Date.now() % (5 * 60 * 1000) < 60000) {
      console.log('📊 System Metrics (not sent to Telegram):', {
        cpu: `${metrics.cpuUsage.toFixed(1)}%`,
        memory: `${metrics.memoryUsage.toFixed(1)}%`,
        disk: `${metrics.diskUsage.toFixed(1)}%`,
        uptime: `${Math.floor(metrics.uptime / 3600)}h`,
        connections: metrics.activeConnections
      });
    }
  }

  public async sendAlert(type: string, severity: 'warning' | 'critical', message: string): Promise<void> {
    const alertKey = `${type}_${severity}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTimes.get(alertKey) || 0;

    // Check cooldown
    if (now - lastAlert < this.ALERT_COOLDOWN) {
      return;
    }

    this.lastAlertTimes.set(alertKey, now);

    try {
      // Send PM2 notification
      const pm2Message = `🚨 CyberShield Alert [${severity.toUpperCase()}]: ${message}`;
      console.log(`📱 PM2 Alert: ${pm2Message}`);
      
      // PM2 will handle the actual notification delivery
      console.log(`✅ Alert logged for PM2: ${message}`);
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  private async getAdminUsers(): Promise<Array<{ id: number }>> {
    try {
      const adminUsers = await storage.getAdminUsers();
      return adminUsers.map(user => ({ id: user.id }));
    } catch (error) {
      console.error('Failed to get admin users:', error);
      return [];
    }
  }

  public async sendNewUserNotification(userId: number, username: string, email: string): Promise<void> {
    try {
      // Send PM2 notification
      const pm2Message = `👤 Новый пользователь зарегистрирован: ${username} (${email})`;
      console.log(`📱 PM2 New User Alert: ${pm2Message}`);
      console.log(`✅ New user notification logged for PM2: ${username}`);
    } catch (error) {
      console.error('Failed to send new user notification:', error);
    }
  }

  public async sendPlatformStatusNotification(status: 'online' | 'offline' | 'degraded'): Promise<void> {
    try {
      // Send PM2 notification
      const pm2Message = `🖥️ Статус платформы изменился: ${status.toUpperCase()}`;
      console.log(`📱 PM2 Platform Status Alert: ${pm2Message}`);
      console.log(`✅ Platform status notification logged for PM2: ${status}`);
    } catch (error) {
      console.error('Failed to send platform status notification:', error);
    }
  }

  public async getCurrentSystemMetrics(): Promise<SystemMetrics> {
    return this.getSystemMetrics();
  }
}

export const monitoringService = MonitoringService.getInstance();

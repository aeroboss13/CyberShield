module.exports = {
  apps: [{
    name: 'cybershield',
    script: 'dist/index.js',
    cwd: '/root/CyberShield',
    user: 'root',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/cybershield/error.log',
    out_file: '/var/log/cybershield/out.log',
    log_file: '/var/log/cybershield/combined.log',
    time: true,
    // PM2 Notifications
    pmx: true,
    // Custom notification script
    post_update: ['npm install', 'npm run build'],
    // Log monitoring
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Error monitoring
    min_uptime: '10s',
    max_restarts: 10,
    // Memory monitoring
    max_memory_restart: '800M'
  }, {
    name: 'http-monitor',
    script: 'scripts/http-monitor.js',
    cwd: '/root/CyberShield',
    user: 'root',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    error_file: '/var/log/cybershield/http-monitor-error.log',
    out_file: '/var/log/cybershield/http-monitor-out.log',
    log_file: '/var/log/cybershield/http-monitor-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};

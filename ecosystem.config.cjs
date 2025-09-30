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
    time: true
  }]
};

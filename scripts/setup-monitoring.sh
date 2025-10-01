#!/bin/bash

# Setup CyberShield Monitoring
echo "Setting up CyberShield monitoring..."

# Create scripts directory if it doesn't exist
mkdir -p /root/CyberShield/scripts

# Make monitor script executable
chmod +x /root/CyberShield/scripts/monitor.sh

# Create log directory
mkdir -p /var/log/cybershield

# Create cron job to run monitoring every minute
echo "Setting up cron job for monitoring..."
(crontab -l 2>/dev/null; echo "*/1 * * * * /root/CyberShield/scripts/monitor.sh") | crontab -

# Install jq if not present (needed for JSON parsing in monitor script)
if ! command -v jq &> /dev/null; then
    echo "Installing jq for JSON parsing..."
    apt-get update && apt-get install -y jq
fi

# Create systemd service for more advanced monitoring (optional)
cat > /etc/systemd/system/cybershield-monitor.service << EOF
[Unit]
Description=CyberShield Application Monitor
After=network.target

[Service]
Type=oneshot
ExecStart=/root/CyberShield/scripts/monitor.sh
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create systemd timer for periodic monitoring
cat > /etc/systemd/system/cybershield-monitor.timer << EOF
[Unit]
Description=Run CyberShield Monitor every minute
Requires=cybershield-monitor.service

[Timer]
OnCalendar=*:*:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable and start the timer
systemctl daemon-reload
systemctl enable cybershield-monitor.timer
systemctl start cybershield-monitor.timer

echo "Monitoring setup complete!"
echo ""
echo "Monitoring options available:"
echo "1. Cron job: Runs every minute via crontab"
echo "2. Systemd timer: Runs every minute via systemd"
echo "3. Manual: Run /root/CyberShield/scripts/monitor.sh"
echo ""
echo "Log files:"
echo "- /var/log/cybershield/monitor.log (monitoring activity)"
echo "- /var/log/cybershield/alerts.log (status change alerts)"
echo "- /tmp/cybershield_alert.json (latest alert in JSON format)"
echo ""
echo "Check monitoring status:"
echo "- systemctl status cybershield-monitor.timer"
echo "- tail -f /var/log/cybershield/monitor.log"
echo "- tail -f /var/log/cybershield/alerts.log"


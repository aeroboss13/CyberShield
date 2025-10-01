#!/bin/bash

# CyberShield Application Monitor
# This script monitors the application status and sends notifications

APP_NAME="cybershield"
LOG_FILE="/var/log/cybershield/monitor.log"
STATUS_FILE="/tmp/cybershield_status"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to check application status
check_status() {
    pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "errored"
}

# Function to send notification (you can customize this)
send_notification() {
    local status=$1
    local message=$2
    
    # Log the notification
    log_message "NOTIFICATION: $message"
    
    # Option 1: Send to system log (always works)
    logger -t "CyberShield-Monitor" "$message"
    
    # Option 2: Send email (if configured)
    # echo "$message" | mail -s "CyberShield Status Alert" your-email@example.com
    
    # Option 3: Send webhook (if you have a webhook URL)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"$message\"}" \
    #     YOUR_WEBHOOK_URL
    
    # Option 4: Send to file for external monitoring
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> /var/log/cybershield/alerts.log
    
    # Option 5: Create a status file that external tools can read
    echo "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" > /tmp/cybershield_alert.json
}

# Main monitoring logic
current_status=$(check_status)
previous_status=""

# Read previous status if file exists
if [ -f "$STATUS_FILE" ]; then
    previous_status=$(cat "$STATUS_FILE")
fi

# Check if status changed
if [ "$current_status" != "$previous_status" ]; then
    case "$current_status" in
        "online")
            if [ "$previous_status" != "" ]; then
                send_notification "recovered" "CyberShield application has recovered and is now ONLINE"
                log_message "Status changed from $previous_status to $current_status"
            fi
            ;;
        "stopped")
            send_notification "down" "CyberShield application has STOPPED"
            log_message "Status changed from $previous_status to $current_status"
            ;;
        "errored")
            send_notification "error" "CyberShield application is in ERROR state"
            log_message "Status changed from $previous_status to $current_status"
            ;;
        "launching")
            send_notification "starting" "CyberShield application is STARTING"
            log_message "Status changed from $previous_status to $current_status"
            ;;
        *)
            send_notification "unknown" "CyberShield application status changed to: $current_status"
            log_message "Status changed from $previous_status to $current_status"
            ;;
    esac
    
    # Update status file
    echo "$current_status" > "$STATUS_FILE"
fi

# Additional health checks
if [ "$current_status" = "online" ]; then
    # Check if application responds to HTTP requests
    if ! curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
        if [ "$previous_status" = "online" ]; then
            send_notification "unhealthy" "CyberShield is running but not responding to health checks"
        fi
    fi
fi

log_message "Monitor check completed - Status: $current_status"


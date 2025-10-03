#!/bin/bash

# PM2 Telegram Monitor Script
# This script monitors PM2 logs and sends alerts to Telegram

# Configuration
TELEGRAM_BOT_TOKEN="8416198210:AAFclEO3hUMUYxGUEvFTqRCj5zPfJ7nnXyE"
TELEGRAM_CHAT_ID="700223418"
LOG_FILE="/var/log/cybershield/out-2.log"
# Fallback to combined log if out-2.log doesn't exist
if [[ ! -f "$LOG_FILE" ]]; then
    LOG_FILE="/var/log/cybershield/combined-2.log"
fi
MONITOR_INTERVAL=30

# Function to send message to Telegram
send_telegram_message() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" \
        -d text="${message}" \
        -d parse_mode="HTML" > /dev/null
}

# Function to check for critical errors
check_critical_errors() {
    local last_check_time="$1"
    
    # Check for critical patterns in logs
    if tail -n 100 "$LOG_FILE" | grep -i "critical\|fatal\|error.*timeout\|connection.*failed" | grep -v "$last_check_time" > /tmp/critical_errors.txt; then
        while IFS= read -r line; do
            if [[ ! -z "$line" ]]; then
                TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
                MESSAGE="🚨 <b>Critical Error Detected</b>
⏰ ${TIMESTAMP}
🔍 <code>${line}</code>"
                send_telegram_message "$MESSAGE"
                echo "Critical error sent to Telegram: $line"
            fi
        done < /tmp/critical_errors.txt
    fi
}

# Function to check system alerts from monitoring service
check_system_alerts() {
    local last_check_time="$1"
    
    # Check for PM2 Alert messages from monitoring service (only from last 5 lines)
    # Filter only for HTTP availability and memory > 90%
    if [[ -f "$LOG_FILE" ]]; then
        if tail -n 5 "$LOG_FILE" | grep "📱 PM2 Alert:" | grep -E "(ВЕБ-СЕРВЕР НЕДОСТУПЕН|КРИТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ ПАМЯТИ|memory.*9[0-9]|memory.*100)" > /tmp/system_alerts.txt; then
            while IFS= read -r line; do
                if [[ ! -z "$line" ]]; then
                    # Create a unique hash for this alert
                    local alert_hash=$(echo "$line" | md5sum | cut -d' ' -f1)
                    
                    # Check if we already sent this exact alert
                    if ! grep -q "$alert_hash" /tmp/sent_alert_notifications.txt 2>/dev/null; then
                        local alert_msg=$(echo "$line" | sed 's/.*📱 PM2 Alert: //')
                        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
                        local message="⚠️ <b>System Alert</b>
⏰ ${timestamp}
${alert_msg}"
                        send_telegram_message "$message"
                        echo "System alert sent to Telegram: $alert_msg"
                        # Remember this alert
                        echo "$alert_hash" >> /tmp/sent_alert_notifications.txt
                    fi
                fi
            done < /tmp/system_alerts.txt
        fi
    fi
}

# Function to check for new user registrations
check_new_users() {
    local last_check_time="$1"
    
    # Check last 10 lines for new user notifications
    if [[ -f "$LOG_FILE" ]]; then
        if tail -n 10 "$LOG_FILE" | grep "📱 PM2 New User Alert:" > /tmp/new_users_check.txt; then
            while IFS= read -r line; do
                if [[ ! -z "$line" ]]; then
                    # Extract the user message
                    local user_msg=$(echo "$line" | sed 's/.*📱 PM2 New User Alert: //')
                    # Create a unique hash for this notification
                    local msg_hash=$(echo "$user_msg" | md5sum | cut -d' ' -f1)
                    
                    # Check if we already sent this exact message
                    if ! grep -q "$msg_hash" /tmp/sent_user_notifications.txt 2>/dev/null; then
                        local current_timestamp=$(date '+%Y-%m-%d %H:%M:%S')
                        local message="👤 <b>New User Registration</b>
⏰ ${current_timestamp}
${user_msg}"
                        send_telegram_message "$message"
                        echo "New user notification sent to Telegram: $user_msg"
                        # Remember this notification
                        echo "$msg_hash" >> /tmp/sent_user_notifications.txt
                    fi
                fi
            done < /tmp/new_users_check.txt
        fi
    fi
}

# Function to check platform status changes (removed - not needed)
check_platform_status() {
    # This function is disabled - platform status changes are not sent to Telegram
    return 0
}

# Main monitoring loop
echo "Starting PM2 Telegram Monitor..."
echo "Monitoring log file: $LOG_FILE"
echo "Check interval: ${MONITOR_INTERVAL} seconds"

# Initialize sent notifications files
touch /tmp/sent_notifications.txt
touch /tmp/sent_user_notifications.txt
touch /tmp/sent_alert_notifications.txt

LAST_CHECK=$(date '+%Y-%m-%d %H:%M:%S')

while true; do
    CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check for different types of alerts (filtered)
    # check_critical_errors "$LAST_CHECK"  # Disabled - too many notifications
    check_system_alerts "$LAST_CHECK"      # Only HTTP and memory > 90%
    check_new_users "$LAST_CHECK"          # New user registrations
    # check_platform_status "$LAST_CHECK"  # Disabled - too many notifications
    
    LAST_CHECK="$CURRENT_TIME"
    
    # Wait before next check
    sleep $MONITOR_INTERVAL
done

#!/bin/bash

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="8416198210:AAFclEO3hUMUYxGUEvFTqRCj5zPfJ7nnXyE"
TELEGRAM_CHAT_ID="700223418"

# Function to send message to Telegram
send_telegram_message() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" \
        -d text="${message}" \
        -d parse_mode="HTML" > /dev/null
}

# Get the message from PM2
MESSAGE="$1"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Format the message
FORMATTED_MESSAGE="🚨 <b>CyberShield Alert</b>
⏰ ${TIMESTAMP}
📝 ${MESSAGE}"

# Send to Telegram
send_telegram_message "${FORMATTED_MESSAGE}"

echo "Telegram notification sent: ${MESSAGE}"

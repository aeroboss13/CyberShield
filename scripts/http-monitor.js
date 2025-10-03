import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const TELEGRAM_BOT_TOKEN = "8416198210:AAFclEO3hUMUYxGUEvFTqRCj5zPfJ7nnXyE";
const TELEGRAM_CHAT_ID = "700223418";

// Function to send message to Telegram
async function sendTelegramMessage(message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    if (response.ok) {
      console.log(`✅ Telegram notification sent: ${message}`);
    } else {
      console.error('Failed to send Telegram message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

// Function to check HTTP availability
async function checkHttpAvailability() {
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

let lastStatus = null;
let alertCooldown = 0;

async function monitorHttp() {
  try {
    const isAvailable = await checkHttpAvailability();
    const currentTime = Date.now();
    
    // Reset cooldown if enough time has passed
    if (currentTime - alertCooldown > 5 * 60 * 1000) { // 5 minutes cooldown
      alertCooldown = 0;
    }
    
    if (isAvailable !== lastStatus) {
      if (!isAvailable && alertCooldown === 0) {
        // Server is down
        await sendTelegramMessage('🚨 <b>CyberShield Alert</b>\n\n🖥️ <b>ВЕБ-СЕРВЕР НЕДОСТУПЕН!</b>\n\nПлатформа не отвечает на HTTP-запросы.\nВремя: ' + new Date().toLocaleString('ru-RU'));
        alertCooldown = currentTime;
        console.log('🚨 Server is DOWN - alert sent');
      } else if (isAvailable && lastStatus === false) {
        // Server is back up
        await sendTelegramMessage('✅ <b>CyberShield Alert</b>\n\n🖥️ <b>ВЕБ-СЕРВЕР ВОССТАНОВЛЕН!</b>\n\nПлатформа снова доступна.\nВремя: ' + new Date().toLocaleString('ru-RU'));
        console.log('✅ Server is UP - recovery alert sent');
      }
      
      lastStatus = isAvailable;
    }
    
    console.log(`HTTP Status: ${isAvailable ? 'UP' : 'DOWN'} (${new Date().toLocaleTimeString()})`);
  } catch (error) {
    console.error('Monitor error:', error);
  }
}

console.log('🔍 Starting HTTP Monitor...');
console.log('Monitoring: http://localhost:5000/api/health');
console.log('Check interval: 30 seconds');

// Start monitoring
setInterval(monitorHttp, 30000);

// Initial check
monitorHttp();

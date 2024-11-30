const axios = require('axios');

class TelegramBot {
  constructor(settings) {
    this.settings = settings;
  }

  // Fungsi untuk mengirim pesan ke Telegram
  async sendMessage(message) {
    if (!this.settings.ENABLE_BOT) return;  // Pastikan bot aktif

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.settings.BOT_TOKEN}/sendMessage`,
        {
          chat_id: this.settings.CHAT_ID,
          text: message,
        }
      );

      // Cek jika pesan berhasil dikirim
      if (!response.data.ok) {
        throw new Error(response.data.description);
      }

      console.log('📤 Report sent to Telegram');
    } catch (error) {
      console.error('❌ Failed to send report to Telegram:', error.message);
    }
  }
}

module.exports = TelegramBot;

const axios = require('axios');
const crypto = require('crypto');
const ProxyChecker = require('./proxyChecker');
const telegramConfig = require('./telegramConfig'); // Import telegramConfig
const TelegramBot = require('./utils/telegramBot');

class Bot {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.proxyCheck = new ProxyChecker(config, logger);
    this.telegramBot = new TelegramBot(telegramConfig); // Gunakan telegramConfig
  }

  async connect(token, proxy = null) {
    try {
      const userAgent = 'Mozilla/5.0 ... Safari/537.3';
      const accountInfo = await this.getSession(token, userAgent, proxy);

      console.log(
        `✅ Connected to session for UID: ${accountInfo.uid}`
      );
      this.logger.info('Session info', {
        uid: accountInfo.uid,
        name: accountInfo.name,
        useProxy: !!proxy,
      });

      if (telegramConfig.ENABLE_BOT) {
        const report = `✅ 🌟 NODEPAY AUTO BOT🌟 ✅\n\n👤 Akun: ${accountInfo.name}\n💰 Report: Connected to session\n🛠 Proxy Used: ${
          proxy ? `${proxy.host}:${proxy.port}` : 'Direct'
        }\n\n🤖 Bot edit by Benskoy`;
        await this.telegramBot.sendMessage(report);
      }

      console.log('');

      const interval = setInterval(async () => {
        try {
          await this.sendPing(accountInfo, token, userAgent, proxy);
        } catch (error) {
          console.log(`❌ Ping error: ${error.message}`);
          this.logger.error('Ping error', { error: error.message });
        }
      }, this.config.retryInterval);

      if (!process.listenerCount('SIGINT')) {
        process.once('SIGINT', () => {
          clearInterval(interval);
          console.log('\n👋 Shutting down...');
        });
      }
    } catch (error) {
      console.log(`❌ Connection error: ${error.message}`);
      this.logger.error('Connection error', { error: error.message, proxy });
    }
  }

  async sendPing(accountInfo, token, userAgent, proxy) {
    const uid = accountInfo.uid || crypto.randomBytes(8).toString('hex');
    const browserId =
      accountInfo.browser_id || crypto.randomBytes(8).toString('hex');

    const pingData = {
      id: uid,
      browser_id: browserId,
      timestamp: Math.floor(Date.now() / 1000),
      version: '2.2.7',
    };

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
      };

      if (proxy) {
        config.proxy = this.buildProxyConfig(proxy);
      }

      await axios.post(this.config.pingURL, pingData, config);

      console.log(`📡 Ping sent for UID: ${uid}`);
      this.logger.info('Ping sent', {
        uid,
        browserId,
        ip: proxy ? proxy.host : 'direct',
      });

      if (telegramConfig.ENABLE_BOT) {
        const report = `✅ 🌟 NODEPAY AUTO BOT🌟 ✅\n\n👤 Akun: ${accountInfo.name}\n💰 Report: Ping Sent\n🛠 Proxy Used: ${
          proxy ? `${proxy.host}:${proxy.port}` : 'Direct'
        }\n\n🤖 Bot edit by Benskoy`;
        await this.telegramBot.sendMessage(report);
      }
    } catch (error) {
      throw new Error('Ping request failed');
    }
  }

  buildProxyConfig(proxy) {
    return proxy && proxy.host
      ? {
          host: proxy.host,
          port: parseInt(proxy.port),
          auth:
            proxy.username && proxy.password
              ? { username: proxy.username, password: proxy.password }
              : undefined,
        }
      : undefined;
  }

  async getSession(token, userAgent, proxy) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
      };

      if (proxy) {
        config.proxy = this.buildProxyConfig(proxy);
      }

      const response = await axios.post(this.config.sessionURL, {}, config);
      return response.data.data;
    } catch (error) {
      throw new Error('Session request failed');
    }
  }
}

module.exports = Bot;

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface TelegramChatMember {
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  user: {
    id: number | string;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  until_date?: number;
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
}

export interface ReplyKeyboardButton {
  text: string;
  web_app?: { url: string };
}

export interface SendMessageOptions {
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  reply_markup?: {
    inline_keyboard?: InlineKeyboardButton[][];
    keyboard?: ReplyKeyboardButton[][];
    remove_keyboard?: boolean;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
  };
  disable_web_page_preview?: boolean;
}

@Injectable()
export class TelegramClientService implements OnModuleInit {
  private readonly logger = new Logger(TelegramClientService.name);
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN || 'MOCK_BOT_TOKEN';
  private readonly baseUrl = `https://api.telegram.org/bot${this.botToken}`;

  async onModuleInit() {
    if (this.botToken !== 'MOCK_BOT_TOKEN' && process.env.TELEGRAM_WEBHOOK_URL) {
      const cleanBase = process.env.TELEGRAM_WEBHOOK_URL.replace(/\/$/, '');
      const fullWebhookUrl = cleanBase.endsWith('/api/v1/bot/webhook')
        ? cleanBase
        : `${cleanBase}/api/v1/bot/webhook`;

      this.logger.log(`Registering Telegram Webhook: ${fullWebhookUrl}`);
      const res = await this.setWebhook(fullWebhookUrl);
      if (res.ok) {
        this.logger.log(`✅ Telegram Webhook bound successfully to ${fullWebhookUrl}`);
      } else {
        this.logger.error(`❌ Failed to bind Telegram Webhook: ${res.description}`);
      }
    }
  }

  async getChatMember(chatId: string | number, userId: string | number): Promise<TelegramChatMember | null> {
    if (this.botToken === 'MOCK_BOT_TOKEN') {
      this.logger.debug(`[MOCK] getChatMember for user ${userId} in chat ${chatId}`);
      return {
        status: 'member',
        user: {
          id: userId,
          is_bot: false,
          first_name: 'TestUser',
        },
      };
    }

    try {
      const response = await this.callApi('getChatMember', {
        chat_id: chatId,
        user_id: userId,
      });

      if (response.ok && response.result) {
        return response.result as TelegramChatMember;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error in getChatMember: ${error.message}`);
      return null;
    }
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    options: SendMessageOptions = {},
  ): Promise<{ ok: boolean; message_id?: number; description?: string }> {
    if (this.botToken === 'MOCK_BOT_TOKEN') {
      this.logger.debug(`[MOCK] sendMessage to ${chatId}: ${text.slice(0, 50)}...`);
      return { ok: true, message_id: Math.floor(Math.random() * 100000) };
    }

    try {
      const body = {
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode || 'HTML',
        disable_web_page_preview: options.disable_web_page_preview ?? true,
        reply_markup: options.reply_markup,
      };

      return await this.callApi('sendMessage', body);
    } catch (error) {
      this.logger.error(`Error in sendMessage to ${chatId}: ${error.message}`);
      return { ok: false, description: error.message };
    }
  }

  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert: boolean = false,
  ): Promise<{ ok: boolean }> {
    if (this.botToken === 'MOCK_BOT_TOKEN') {
      return { ok: true };
    }

    try {
      return await this.callApi('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      });
    } catch (error) {
      this.logger.error(`Error in answerCallbackQuery: ${error.message}`);
      return { ok: false };
    }
  }

  async setWebhook(url: string, secretToken?: string): Promise<{ ok: boolean; description?: string }> {
    if (this.botToken === 'MOCK_BOT_TOKEN') {
      return { ok: true, description: 'Mock webhook set successfully' };
    }

    try {
      return await this.callApi('setWebhook', {
        url,
        secret_token: secretToken,
      });
    } catch (error) {
      this.logger.error(`Error in setWebhook: ${error.message}`);
      return { ok: false, description: error.message };
    }
  }

  async sendPhoto(
    chatId: string | number,
    photoUrl: string,
    options: {
      caption?: string;
      parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
      reply_markup?: SendMessageOptions['reply_markup'];
    } = {},
  ): Promise<{ ok: boolean; message_id?: number; description?: string }> {
    if (this.botToken === 'MOCK_BOT_TOKEN') {
      this.logger.debug(`[MOCK] sendPhoto to ${chatId}: ${photoUrl.slice(0, 60)}...`);
      return { ok: true, message_id: Math.floor(Math.random() * 100000) };
    }

    try {
      const body: Record<string, any> = {
        chat_id: chatId,
        photo: photoUrl,
      };
      if (options.caption) body.caption = options.caption;
      body.parse_mode = options.parse_mode || 'HTML';
      if (options.reply_markup) body.reply_markup = options.reply_markup;

      return await this.callApi('sendPhoto', body);
    } catch (error) {
      this.logger.error(`Error in sendPhoto to ${chatId}: ${error.message}`);
      return { ok: false, description: error.message };
    }
  }

  private async callApi(method: string, payload: Record<string, any>, retries = 3): Promise<any> {
    const url = `${this.baseUrl}/${method}`;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (response.status === 429 && data.parameters?.retry_after) {
          const waitSec = data.parameters.retry_after;
          this.logger.warn(`Rate limited by Telegram API. Waiting ${waitSec}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
          continue;
        }

        return data;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }
}

import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "../../errors/AppError";

export interface SendWhatsAppTextParams {
  to: string;
  body: string;
}

export interface SendWhatsAppTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: Array<Record<string, unknown>>;
}

export const whatsappService = {
  /**
   * Sends a text message via the official Meta WhatsApp Cloud API.
   */
  async sendTextMessage({ to, body }: SendWhatsAppTextParams): Promise<{ messageId: string }> {
    const token = env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_API_TOKEN;
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      throw new AppError(
        503,
        "WHATSAPP_NOT_CONFIGURED",
        "WhatsApp Cloud API credentials (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are not configured."
      );
    }

    const cleanRecipient = to.replace(/[^\d]/g, "");
    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanRecipient,
        type: "text",
        text: {
          preview_url: false,
          body
        }
      })
    });

    const data = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string; code?: number };
    };

    if (!response.ok) {
      logger.error(
        { status: response.status, error: data.error, recipient: cleanRecipient },
        "Failed to send WhatsApp text message"
      );
      throw new AppError(
        502,
        "WHATSAPP_SEND_FAILED",
        data.error?.message || "Failed to send WhatsApp message via Meta Cloud API"
      );
    }

    const messageId = data.messages?.[0]?.id || "unknown";
    logger.info({ messageId, recipient: cleanRecipient }, "WhatsApp text message sent");
    return { messageId };
  },

  /**
   * Sends a pre-approved template message via the official Meta WhatsApp Cloud API.
   */
  async sendTemplateMessage({
    to,
    templateName,
    languageCode = "en",
    components = []
  }: SendWhatsAppTemplateParams): Promise<{ messageId: string }> {
    const token = env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_API_TOKEN;
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      throw new AppError(
        503,
        "WHATSAPP_NOT_CONFIGURED",
        "WhatsApp Cloud API credentials (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are not configured."
      );
    }

    const cleanRecipient = to.replace(/[^\d]/g, "");
    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanRecipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          ...(components.length > 0 ? { components } : {})
        }
      })
    });

    const data = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string; code?: number };
    };

    if (!response.ok) {
      logger.error(
        { status: response.status, error: data.error, recipient: cleanRecipient, templateName },
        "Failed to send WhatsApp template message"
      );
      throw new AppError(
        502,
        "WHATSAPP_SEND_FAILED",
        data.error?.message || "Failed to send WhatsApp template message"
      );
    }

    const messageId = data.messages?.[0]?.id || "unknown";
    logger.info({ messageId, recipient: cleanRecipient, templateName }, "WhatsApp template message sent");
    return { messageId };
  }
};

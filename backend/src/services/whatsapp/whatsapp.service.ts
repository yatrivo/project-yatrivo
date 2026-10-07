import { env, isWhatsAppProviderConfigured } from "../../config/env";
import { logger } from "../../config/logger";
import { query } from "../../db/postgres";

export interface SendWhatsAppResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  async sendMessage(params: {
    recipientPhone: string;
    message: string;
    type?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SendWhatsAppResult> {
    const { recipientPhone, message, type = "review_request", metadata = {} } = params;

    // Clean phone number (remove non-digits)
    const cleanPhone = (recipientPhone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      logger.warn({ recipientPhone }, "Skipping WhatsApp dispatch: invalid or empty phone number");
      return { success: false, provider: "none", error: "Empty phone number" };
    }

    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const providerName = env.WHATSAPP_PROVIDER || "simulated";

    let success = true;
    let providerMessageId: string | undefined = undefined;
    let failureReason: string | undefined = undefined;

    // 1. If external WhatsApp provider API is configured, dispatch HTTP request
    if (isWhatsAppProviderConfigured && env.WHATSAPP_API_BASE_URL && env.WHATSAPP_API_TOKEN) {
      try {
        const response = await fetch(env.WHATSAPP_API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.WHATSAPP_API_TOKEN}`
          },
          body: JSON.stringify({
            to: formattedPhone,
            phone: formattedPhone,
            recipient: formattedPhone,
            message: message,
            text: message,
            metadata
          })
        });

        const resData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (!response.ok) {
          success = false;
          failureReason = (resData?.message as string) || `WhatsApp API error: HTTP ${response.status}`;
          logger.warn({ phone: formattedPhone, status: response.status, resData }, "WhatsApp API request failed");
        } else {
          providerMessageId =
            (resData?.id as string) ||
            (resData?.messageId as string) ||
            ((resData?.messages as Array<{ id: string }>)?.[0]?.id);
          logger.info({ phone: formattedPhone, providerMessageId }, "WhatsApp message sent successfully via provider");
        }
      } catch (err: unknown) {
        success = false;
        failureReason = err instanceof Error ? err.message : "WhatsApp dispatch error";
        logger.error({ err, phone: formattedPhone }, "WhatsApp network error during message send");
      }
    } else {
      // In dev / test or when external gateway isn't connected, log simulated delivery
      providerMessageId = `mock_wa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      logger.info(
        { phone: formattedPhone, provider: "simulated", providerMessageId },
        "WhatsApp message processed and sent (test/simulated mode)"
      );
    }

    // 2. Persist notification dispatch to notifications table
    try {
      await query(
        `INSERT INTO notifications (
          type, channel, status, recipient_phone, message, provider, provider_message_id,
          sent_at, failed_at, failure_reason, metadata
        ) VALUES ($1, 'whatsapp', $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          type,
          success ? "sent" : "failed",
          formattedPhone,
          message,
          providerName,
          providerMessageId || null,
          success ? new Date() : null,
          success ? null : new Date(),
          failureReason || null,
          JSON.stringify(metadata)
        ]
      );
    } catch (dbErr) {
      logger.warn({ dbErr }, "Failed to persist WhatsApp record to notifications table");
    }

    return {
      success,
      provider: providerName,
      messageId: providerMessageId,
      error: failureReason
    };
  }
}

export const whatsAppService = new WhatsAppService();

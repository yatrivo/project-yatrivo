import { logger } from "../../../config/logger";
import type { EmailPayload, EmailProvider, EmailResult } from "../email.types";

export class ResendEmailProvider implements EmailProvider {
  public readonly name = "resend";
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.apiKey = apiKey.trim();
    this.defaultFrom = defaultFrom;
  }

  async send(payload: EmailPayload): Promise<EmailResult> {
    const from = payload.from || this.defaultFrom;

    if (!this.apiKey) {
      logger.info(
        {
          provider: "resend (dev fallback)",
          to: payload.to,
          subject: payload.subject,
          from
        },
        "RESEND_API_KEY not configured. Email logged to console instead of sending."
      );
      // If HTML has a reset link, print it explicitly so developer can click it:
      const linkMatch = payload.html.match(/href="([^"]+)"/);
      if (linkMatch) {
        logger.info(`[EMAIL LINK PREVIEW] -> ${linkMatch[1]}`);
      }

      return {
        success: true,
        messageId: `dev-simulated-${Date.now()}`
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          ...(payload.text ? { text: payload.text } : {})
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.message || `HTTP ${response.status}: Failed to send email via Resend`;
        logger.error({ error: errorMsg, to: payload.to }, "Resend email delivery failed");
        return {
          success: false,
          error: errorMsg
        };
      }

      logger.info({ messageId: data.id, to: payload.to }, "Email delivered via Resend");
      return {
        success: true,
        messageId: data.id
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error sending email";
      logger.error({ error: errorMsg, to: payload.to }, "Resend network error");
      return {
        success: false,
        error: errorMsg
      };
    }
  }
}

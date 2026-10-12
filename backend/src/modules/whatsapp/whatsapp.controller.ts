import crypto from "node:crypto";
import { Request, Response } from "express";
import { z } from "zod";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { whatsappService } from "./whatsapp.service";

const sendMessageSchema = z.object({
  to: z.string().trim().min(7, "Recipient phone number is required").max(30),
  type: z.enum(["text", "template"]).default("text"),
  body: z.string().trim().optional(),
  templateName: z.string().trim().optional(),
  languageCode: z.string().trim().default("en"),
  components: z.array(z.record(z.string(), z.unknown())).optional()
});

function verifyWebhookSignature(req: Request): boolean {
  if (!env.WHATSAPP_APP_SECRET) {
    // Signature verification is optional if WHATSAPP_APP_SECRET is not set
    return true;
  }

  const signatureHeader = req.headers["x-hub-signature-256"];
  if (typeof signatureHeader !== "string" || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const rawBody = JSON.stringify(req.body);
  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", env.WHATSAPP_APP_SECRET)
      .update(rawBody)
      .digest("hex");

  const sigBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export const whatsappController = {
  /**
   * GET /api/v1/webhooks/whatsapp
   * Meta Webhook verification handshake endpoint.
   */
  async verifyWebhook(req: Request, res: Response): Promise<void> {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const configuredToken = env.WHATSAPP_VERIFY_TOKEN;

    if (!configuredToken) {
      logger.warn("WhatsApp webhook verification attempted, but WHATSAPP_VERIFY_TOKEN is not set in environment.");
      res.status(503).json({
        message: "WHATSAPP_VERIFY_TOKEN is not configured on the server"
      });
      return;
    }

    if (mode === "subscribe" && token === configuredToken) {
      logger.info("WhatsApp webhook verified successfully with Meta.");
      res.status(200).type("text/plain").send(String(challenge ?? ""));
      return;
    }

    logger.warn(
      { mode, tokenMatches: token === configuredToken },
      "WhatsApp webhook verification failed due to token mismatch or invalid hub.mode"
    );
    res.sendStatus(403);
  },

  /**
   * POST /api/v1/webhooks/whatsapp
   * Receives incoming WhatsApp messages and delivery/read status updates from Meta.
   */
  async receiveWebhook(req: Request, res: Response): Promise<void> {
    if (!verifyWebhookSignature(req)) {
      logger.warn("Rejected WhatsApp webhook event due to invalid X-Hub-Signature-256");
      res.sendStatus(401);
      return;
    }

    const payload = req.body;

    if (payload?.object !== "whatsapp_business_account") {
      res.sendStatus(404);
      return;
    }

    // Acknowledge receipt immediately with 200 OK as required by Meta
    res.status(200).json({ received: true });

    try {
      const entries = Array.isArray(payload.entry) ? payload.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          const value = change?.value;
          if (!value) continue;

          // Handle incoming customer messages
          if (Array.isArray(value.messages)) {
            for (const message of value.messages) {
              const senderPhone = message?.from;
              const messageId = message?.id;
              const messageType = message?.type;
              const textBody = message?.text?.body || null;
              const profileName = value.contacts?.[0]?.profile?.name || null;

              logger.info(
                {
                  messageId,
                  from: senderPhone,
                  profileName,
                  type: messageType,
                  text: textBody
                },
                "Received incoming WhatsApp message"
              );
            }
          }

          // Handle outbound message delivery/read statuses
          if (Array.isArray(value.statuses)) {
            for (const statusObj of value.statuses) {
              logger.debug(
                {
                  messageId: statusObj?.id,
                  status: statusObj?.status,
                  recipientId: statusObj?.recipient_id
                },
                "Received WhatsApp message status update"
              );
            }
          }
        }
      }
    } catch (error) {
      logger.error({ err: error }, "Error processing incoming WhatsApp webhook payload");
    }
  },

  /**
   * POST /api/v1/whatsapp/send
   * Admin endpoint to send an outbound WhatsApp text or template message.
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid WhatsApp message payload",
        errors: parsed.error.flatten().fieldErrors
      });
      return;
    }

    const { to, type, body, templateName, languageCode, components } = parsed.data;

    if (type === "template") {
      if (!templateName) {
        res.status(400).json({ message: "templateName is required when type is 'template'" });
        return;
      }
      const result = await whatsappService.sendTemplateMessage({
        to,
        templateName,
        languageCode,
        components
      });
      res.status(200).json({ success: true, ...result });
      return;
    }

    if (!body) {
      res.status(400).json({ message: "body is required when type is 'text'" });
      return;
    }

    const result = await whatsappService.sendTextMessage({ to, body });
    res.status(200).json({ success: true, ...result });
  }
};

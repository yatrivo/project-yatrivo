import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate, requireAdmin } from "../auth/auth.middleware";
import { whatsappController } from "./whatsapp.controller";

export const whatsappRouter = Router();

// Public Webhook Verification (Meta GET challenge)
whatsappRouter.get(
  "/webhooks/whatsapp",
  asyncHandler(whatsappController.verifyWebhook)
);

// Public Webhook Event Receiver (Meta POST incoming messages & status updates)
whatsappRouter.post(
  "/webhooks/whatsapp",
  asyncHandler(whatsappController.receiveWebhook)
);

// Admin endpoint to send outbound WhatsApp messages
whatsappRouter.post(
  "/whatsapp/send",
  authenticate,
  requireAdmin,
  asyncHandler(whatsappController.sendMessage)
);

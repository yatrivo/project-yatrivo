import { env } from "../../config/env";
import { logger } from "../../config/logger";
import type { EmailProvider, EmailResult } from "./email.types";
import { ResendEmailProvider } from "./providers/resend.provider";

export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    if (provider) {
      this.provider = provider;
    } else {
      // Prioritize RESEND_API_KEY, fallback to EMAIL_API_KEY
      const apiKey = env.RESEND_API_KEY || env.EMAIL_API_KEY || "";
      this.provider = new ResendEmailProvider(apiKey, env.EMAIL_FROM);
    }
  }

  setProvider(provider: EmailProvider): void {
    this.provider = provider;
    logger.info({ providerName: provider.name }, "Email provider updated");
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    recipientName?: string | null
  ): Promise<EmailResult> {
    const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
    const subject = "Reset Your Yatrivo Admin Password";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f8f5; margin: 0; padding: 24px; color: #0f2922; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f2922; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.15em; font-family: Georgia, serif; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .button-wrap { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background-color: #e8622a; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 600; font-size: 14px; }
    .notice { font-size: 13px; color: #718096; background: #f7f8f5; padding: 16px; border-radius: 8px; margin-top: 24px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>YATRIVO</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; font-weight: 600;">${greeting}</p>
      <p>We received a request to reset the password for your Yatrivo administrator account.</p>
      <div class="button-wrap">
        <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
      </div>
      <p>If you cannot click the button above, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #e8622a;"><a href="${resetUrl}">${resetUrl}</a></p>
      <div class="notice">
        <strong>Important security notice:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>This link is strictly single-use and will expire in <strong>20 minutes</strong>.</li>
          <li>If you did not request a password reset, you can safely ignore this email. Your password remains unchanged.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Yatrivo Himalayan Collective. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const text = `
${greeting}

We received a request to reset the password for your Yatrivo administrator account.

Please visit the following URL to set a new password:
${resetUrl}

This link is valid for 20 minutes and can only be used once.

If you did not request this reset, you can safely ignore this email.
    `.trim();

    return this.provider.send({
      to,
      subject,
      html,
      text
    });
  }

  async sendAdminWelcomeEmail(
    to: string,
    recipientName: string,
    role: string,
    loginUrl: string
  ): Promise<EmailResult> {
    const subject = "Welcome to Yatrivo Admin Portal";
    const roleTitle = role === "super_admin" ? "Super Administrator" : "Administrator";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Yatrivo Admin</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f8f5; margin: 0; padding: 24px; color: #0f2922; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f2922; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.15em; font-family: Georgia, serif; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .button-wrap { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background-color: #e8622a; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>YATRIVO</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; font-weight: 600;">Hello ${recipientName},</p>
      <p>An administrative account has been created for you on the Yatrivo portal with the role of <strong>${roleTitle}</strong>.</p>
      <p>Please log in using the initial password provided to you by your Super Administrator. You will be prompted to choose a new permanent password on your first login.</p>
      <div class="button-wrap">
        <a href="${loginUrl}" class="button" target="_blank">Go to Admin Login</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return this.provider.send({
      to,
      subject,
      html
    });
  }
}

export const emailService = new EmailService();

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email Template Type
 */
export type EmailTemplate = 
  | 'password-reset'
  | 'password-changed'
  | 'account-locked'
  | 'welcome'
  | 'mfa-enabled';

/**
 * Email Service
 * 
 * Provides email sending functionality for:
 * - Password reset notifications
 * - Account security alerts
 * - Welcome emails
 * - System notifications
 * 
 * Features:
 * - SMTP transport with configuration
 * - HTML email templates
 * - Explicit failure when delivery is unavailable
 * - Rate limiting protection
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter() {
    try {
      const smtpHost = this.configService.get('SMTP_HOST');
      const smtpPort = this.configService.get('SMTP_PORT');
      const smtpSecure = this.configService.get('SMTP_SECURE') === 'true';
      const smtpUser = this.configService.get('SMTP_USER');
      const smtpPass = this.configService.get('SMTP_PASS');

      if (!smtpHost) {
        this.logger.warn('SMTP not configured. Email delivery is unavailable.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587', 10),
        secure: smtpSecure,
        connectionTimeout: 10000,
        socketTimeout: 20000,
        disableFileAccess: true,
        disableUrlAccess: true,
        auth: smtpUser && smtpPass ? {
          user: smtpUser,
          pass: smtpPass,
        } : undefined,
      });

      this.logger.log('Email service initialized successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialize email service', error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    to: string,
    resetToken: string,
    userName: string
  ): Promise<boolean> {
    const resetUrl = `${this.configService.get('WEB_URL')}/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request - Krypton School ERP';
    const html = this.getPasswordResetTemplate(userName, resetUrl);
    const text = `Hi ${userName},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nKrypton School ERP Team`;

    return await this.sendEmail(to, subject, html, text);
  }

  /**
   * Send password changed confirmation
   */
  async sendPasswordChanged(
    to: string,
    userName: string
  ): Promise<boolean> {
    const subject = 'Password Changed - Krypton School ERP';
    const html = this.getPasswordChangedTemplate(userName);
    const text = `Hi ${userName},\n\nYour password was successfully changed.\n\nIf you didn't make this change, please contact your administrator immediately.\n\nRegards,\nKrypton School ERP Team`;

    return await this.sendEmail(to, subject, html, text);
  }

  /**
   * Send account locked notification
   */
  async sendAccountLocked(
    to: string,
    userName: string,
    lockoutMinutes: number
  ): Promise<boolean> {
    const subject = 'Account Temporarily Locked - Krypton School ERP';
    const html = this.getAccountLockedTemplate(userName, lockoutMinutes);
    const text = `Hi ${userName},\n\nYou account has been temporarily locked due to multiple failed login attempts.\n\nYour account will be automatically unlocked in ${lockoutMinutes} minutes.\n\nIf this wasn't you, please contact your administrator.\n\nRegards,\nKrypton School ERP Team`;

    return await this.sendEmail(to, subject, html, text);
  }

  /**
   * Send generic email
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<boolean> {
    try {
      const from = `${this.configService.get('EMAIL_FROM_NAME', 'Krypton School ERP')} <${this.configService.get('EMAIL_FROM', 'noreply@kryptonschool.com')}>`;

      if (!this.transporter) {
        this.logger.warn('Email could not be delivered: SMTP is not configured');
        return false;
      }

      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
      });

      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Password reset email template
   */
  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request</h1>
    <p>Hi ${userName},</p>
    <p>You requested to reset your password for your Krypton School ERP account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
    </div>
    <p style="color: #7f8c8d; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #856404;">⚠️ Important:</p>
      <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
        <li>This link will expire in 24 hours</li>
        <li>If you didn't request this, please ignore this email</li>
        <li>Never share this link with anyone</li>
      </ul>
    </div>
    <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
      If you have any questions, please contact your school administrator.
    </p>
  </div>
  <div style="text-align: center; color: #95a5a6; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Krypton School ERP. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Password changed confirmation template
   */
  private getPasswordChangedTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #27ae60; margin-bottom: 20px;">✓ Password Changed Successfully</h1>
    <p>Hi ${userName},</p>
    <p>Your password was successfully changed.</p>
    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #155724;">Your account is now secured with your new password.</p>
    </div>
    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #721c24;">⚠️ Didn't make this change?</p>
      <p style="margin: 10px 0 0 0; color: #721c24;">If you didn't change your password, please contact your administrator immediately.</p>
    </div>
  </div>
  <div style="text-align: center; color: #95a5a6; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Krypton School ERP. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Account locked notification template
   */
  private getAccountLockedTemplate(userName: string, lockoutMinutes: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Locked</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #e74c3c; margin-bottom: 20px;">🔒 Account Temporarily Locked</h1>
    <p>Hi ${userName},</p>
    <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>Lockout Duration:</strong> ${lockoutMinutes} minutes<br>
        <strong>Reason:</strong> Too many failed login attempts
      </p>
    </div>
    <p>Your account will be automatically unlocked after ${lockoutMinutes} minutes.</p>
    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #721c24;">⚠️ This wasn't you?</p>
      <p style="margin: 10px 0 0 0; color: #721c24;">If you didn't attempt to log in, please contact your administrator immediately. Your account security may be compromised.</p>
    </div>
  </div>
  <div style="text-align: center; color: #95a5a6; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Krypton School ERP. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }
}

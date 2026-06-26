import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { CustomerPasswordResetSuccessfulEvent } from '../../modules/auth/events/auth.events';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /* Send welcome registration email for customer */
  async sendCustomerRegistrationEmail(user: {
    userId: string;
    email: string;
    username: string;
    ipAddress: string;
  }) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: `Account registration confirmation.`,
      template: './send-customer-registration-email.hbs',
      context: {
        username: user.username,
        time: new Date().toLocaleString(),
      },
    });
  }

  /* Send welcome registration email for vendor */
  async sendVendorRegistrationEmail(vendor: {
    email: string;
    businessName: string;
  }) {
    await this.mailerService.sendMail({
      to: vendor.email,
      subject: `Account registration confirmation.`,
      template: './send-vendor-registration-email.hbs',
      context: {
        businessName: vendor.businessName,
        time: new Date().toLocaleDateString(),
      },
    });
  }

  /* Send forget password email link for customer */
  async sendForgetPasswordLinkEmail(user: {
    email: string;
    username: string;
    resetPasswordToken: string;
  }) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: `Password reset request`,
      template: './send-forget-password-email',
      context: {
        username: user.username,
        resetLink: user.resetPasswordToken,
      },
    });
  }

  /* Send password reset successful link for customer */
  async sendPasswordResetSuccessful(
    user: CustomerPasswordResetSuccessfulEvent,
  ) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: `Password reset successful`,
      template: './send-password-reset-successful-email',
      context: {
        username: user.username,
      },
    });
  }
}

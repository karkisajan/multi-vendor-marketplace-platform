import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /* Send welcome registration email for customer */
  async sendCustomerRegistrationEmail(user: {
    email: string;
    username: string;
  }) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: `Account registration confirmation.`,
      template: './customer-registration.hbs',
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
      template: './vendor-registration.hbs',
      context: {
        businessName: vendor.businessName,
        time: new Date().toLocaleDateString(),
      },
    });
  }
}

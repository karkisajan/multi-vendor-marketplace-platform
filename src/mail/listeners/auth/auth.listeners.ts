import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MAIL_EVENTS } from 'src/mail/events/mail-event-names';
import {
  UserRegistrationEvent,
  VendorRegistrationEvent,
} from 'src/mail/events/mail.events';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthListener {
  private readonly logger = new Logger(AuthListener.name);
  constructor(private readonly mailService: MailService) {}

  /* Customer registration event */
  @OnEvent(MAIL_EVENTS.CUSTOMER_REGISTERED)
  async handleCustomerRegistred(event: UserRegistrationEvent) {
    try {
      await this.mailService.sendCustomerRegistrationEmail(event);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${event.email}`,
        error,
      );
    }
  }

  /* Vendor registration event */
  @OnEvent(MAIL_EVENTS.VENDOR_REGISTERED)
  async handleVendorRegistered(event: VendorRegistrationEvent) {
    try {
      await this.mailService.sendVendorRegistrationEmail(event);
    } catch (error) {
      this.logger.error(
        `Failed tp send welcome email to ${event.email}`,
        error,
      );
    }
  }
}

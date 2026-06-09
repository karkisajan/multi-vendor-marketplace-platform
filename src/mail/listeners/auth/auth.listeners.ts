import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AUTH_EVENTS } from 'src/mail/events/auth-event-names';
import {
  CustomerForgetPasswordEvent,
  CustomerPasswordResetSuccessfulEvent,
  UserRegistrationEvent,
  VendorRegistrationEvent,
} from 'src/mail/events/auth.events';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthListener {
  private readonly logger = new Logger(AuthListener.name);
  constructor(private readonly mailService: MailService) {}

  /* Customer registration event */
  @OnEvent(AUTH_EVENTS.CUSTOMER_REGISTERED)
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
  @OnEvent(AUTH_EVENTS.VENDOR_REGISTERED)
  async handleVendorRegistered(event: VendorRegistrationEvent) {
    try {
      await this.mailService.sendVendorRegistrationEmail(event);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${event.email}`,
        error,
      );
    }
  }

  /* Customer password reset event */
  @OnEvent(AUTH_EVENTS.CUSTOMER_FORGET_PASSWORD)
  async handleForgetPasswordEvent(event: CustomerForgetPasswordEvent) {
    try {
      await this.mailService.sendForgetPasswordLinkEmail(event);
    } catch (error) {
      this.logger.error(
        `Failed to send reset password link to ${event.email}`,
        error,
      );
    }
  }

  /* Customer password reset successful email */
  @OnEvent(AUTH_EVENTS.CUSTOMER_PASSWORD_RESET_SUCCESSFUL)
  async handleCustomerPasswordResetSuccessful(
    event: CustomerPasswordResetSuccessfulEvent,
  ) {
    try {
      await this.mailService.sendPasswordResetSuccessful(event);
    } catch (error) {
      this.logger.error(
        `Failed to send reset password successful email to ${event.email}`,
        error,
      );
    }
  }
}

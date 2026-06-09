import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AUTH_EVENTS } from 'src/mail/events/auth-event-names';
import {
  CustomerForgetPasswordEvent,
  CustomerPasswordResetSuccessfulEvent,
  UserLoggedInEvent,
  UserRegistrationEvent,
} from 'src/mail/events/auth.events';
import { AuditLogRepository } from 'src/modules/audit-logs/repositories/audit-logs.repository';

@Injectable()
export class AuditLoggingListener {
  private readonly logger = new Logger(AuditLoggingListener.name);
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  @OnEvent(AUTH_EVENTS.CUSTOMER_REGISTERED)
  async handleCustomerRegistration(event: UserRegistrationEvent) {
    try {
      await this.auditLogRepository.createAuditLog(
        'CUSTOMER_REGISTERED',
        event.userId,
        event.email,
        event.ipAddress,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for customer registration. User ID: ${event.userId}`,
        error,
      );
    }
  }

  @OnEvent(AUTH_EVENTS.CUSTOMER_LOGGED_IN)
  async handleCustomerLoggedIn(event: UserLoggedInEvent) {
    try {
      await this.auditLogRepository.createAuditLog(
        'CUSTOMER_LOGGED_IN',
        event.userId,
        event.email,
        event.ipAddress,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for customer login. User ID: ${event.userId}`,
        error,
      );
    }
  }

  @OnEvent(AUTH_EVENTS.CUSTOMER_FORGET_PASSWORD)
  async handleCustomerForgetPassword(event: CustomerForgetPasswordEvent) {
    try {
      await this.auditLogRepository.createAuditLog(
        'CUSTOMER_FORGET_PASSWORD',
        event.userId,
        event.email,
        event.ipAddress,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for customer forget password. User ID: ${event.userId}`,
        error,
      );
    }
  }

  @OnEvent(AUTH_EVENTS.CUSTOMER_PASSWORD_RESET_SUCCESSFUL)
  async handleCustomerPasswordReset(
    event: CustomerPasswordResetSuccessfulEvent,
  ) {
    try {
      await this.auditLogRepository.createAuditLog(
        'CUSTOMER_PASSWORD_RESET_SUCCESSFUL',
        event.userId,
        event.email,
        event.ipAddress,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for customer password reset. User ID: ${event.userId}`,
        error,
      );
    }
  }
}

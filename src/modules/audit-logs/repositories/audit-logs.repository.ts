import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-logs.entity';

@Injectable()
export class AuditLogRepository extends Repository<AuditLog> {
  constructor(dataSource: DataSource) {
    super(AuditLog, dataSource.createEntityManager());
  }

  async createAuditLog(
    action: string,
    userId: string,
    email: string,
    ipAddress: string,
  ): Promise<AuditLog> {
    const auditLog = this.create({
      action,
      userId: userId,
      email: email,
      ipAddress: ipAddress,
    });

    return await this.save(auditLog);
  }
}

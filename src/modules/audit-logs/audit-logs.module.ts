import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-logs.entity';
import { AuditLogRepository } from './repositories/audit-logs.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogRepository],
  exports: [AuditLogRepository],
})
export class AuditLogsModule {}

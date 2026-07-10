import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedFlaggedByAndFlagReasonColumnOnProductTable1783051196572 implements MigrationInterface {
  name = 'AddedFlaggedByAndFlagReasonColumnOnProductTable1783051196572';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "flag_reason" character varying(500)`,
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "flagged_by" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "flagged_by"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "flag_reason"`);
  }
}

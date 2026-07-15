import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCategoryDescription1784023871204 implements MigrationInterface {
  name = 'AlterCategoryDescription1784023871204';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "short_description" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "long_description" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "long_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "short_description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "description" character varying`,
    );
  }
}

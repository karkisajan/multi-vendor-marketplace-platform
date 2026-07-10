import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlteredSellingPriceColumnOnProductVariantTable1783225584612 implements MigrationInterface {
  name = 'AlteredSellingPriceColumnOnProductVariantTable1783225584612';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variants" RENAME COLUMN "sellling_price" TO "selling_price"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variants" RENAME COLUMN "selling_price" TO "sellling_price"`,
    );
  }
}

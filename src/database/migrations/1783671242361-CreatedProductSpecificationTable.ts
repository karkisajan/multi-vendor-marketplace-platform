import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatedProductSpecificationTable1783671242361 implements MigrationInterface {
  name = 'CreatedProductSpecificationTable1783671242361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_specifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "key" character varying(100) NOT NULL, "value" character varying(255) NOT NULL, "sort_order" integer DEFAULT '0', CONSTRAINT "PK_1936a81a371c31faaddb04331a2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_specifications" ADD CONSTRAINT "FK_e1acdfdecfde64e57b91b7256e8" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_specifications" DROP CONSTRAINT "FK_e1acdfdecfde64e57b91b7256e8"`,
    );
    await queryRunner.query(`DROP TABLE "product_specifications"`);
  }
}

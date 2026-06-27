import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedProductTableProductVariantTableProductImagesTable1782542895258 implements MigrationInterface {
    name = 'CreatedProductTableProductVariantTableProductImagesTable1782542895258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_7f1a676cadb42cc18fe9a367608"`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_7645bd68229997627f7b2191687" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_7645bd68229997627f7b2191687"`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_7f1a676cadb42cc18fe9a367608" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedStatusColumnOnProductVariantTable1783225023138 implements MigrationInterface {
    name = 'AddedStatusColumnOnProductVariantTable1783225023138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."product_variants_status_enum" AS ENUM('in_stock', 'out_of_stock')`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "status" "public"."product_variants_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."products_status_enum" RENAME TO "products_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('published', 'draft', 'flagged', 'archieved')`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" TYPE "public"."products_status_enum" USING "status"::"text"::"public"."products_status_enum"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum_old" AS ENUM('published', 'draft', 'archieved')`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" TYPE "public"."products_status_enum_old" USING "status"::"text"::"public"."products_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."products_status_enum_old" RENAME TO "products_status_enum"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."product_variants_status_enum"`);
    }

}

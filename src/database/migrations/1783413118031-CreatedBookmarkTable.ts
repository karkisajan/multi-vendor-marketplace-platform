import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedBookmarkTable1783413118031 implements MigrationInterface {
    name = 'CreatedBookmarkTable1783413118031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bookmarks_bookmark_type_enum" AS ENUM('PRODUCT', 'BUSINESS')`);
        await queryRunner.query(`CREATE TABLE "bookmarks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_id" uuid NOT NULL, "product_id" uuid, "vendor_profile_id" uuid, "bookmark_type" "public"."bookmarks_bookmark_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7f976ef6cecd37a53bd11685f32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_05c5b94a5fbfaec47b1632bf5b1" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_9288f22818b3cf97ffb00609771" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_06f69e4df275b094976f7f3fd89" FOREIGN KEY ("vendor_profile_id") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_06f69e4df275b094976f7f3fd89"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_9288f22818b3cf97ffb00609771"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_05c5b94a5fbfaec47b1632bf5b1"`);
        await queryRunner.query(`DROP TABLE "bookmarks"`);
        await queryRunner.query(`DROP TYPE "public"."bookmarks_bookmark_type_enum"`);
    }

}

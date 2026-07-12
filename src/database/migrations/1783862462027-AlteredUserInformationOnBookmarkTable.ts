import { MigrationInterface, QueryRunner } from "typeorm";

export class AlteredUserInformationOnBookmarkTable1783862462027 implements MigrationInterface {
    name = 'AlteredUserInformationOnBookmarkTable1783862462027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_9288f22818b3cf97ffb00609771"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_06f69e4df275b094976f7f3fd89"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" RENAME COLUMN "vendor_profile_id" TO "vendor_id"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_9288f22818b3cf97ffb00609771" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_7a480e1176bc587d0d5ec7b378f" FOREIGN KEY ("vendor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_7a480e1176bc587d0d5ec7b378f"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_9288f22818b3cf97ffb00609771"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" RENAME COLUMN "vendor_id" TO "vendor_profile_id"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_06f69e4df275b094976f7f3fd89" FOREIGN KEY ("vendor_profile_id") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ADD CONSTRAINT "FK_9288f22818b3cf97ffb00609771" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovedColumnOnBookmarkTable1783787760248 implements MigrationInterface {
    name = 'RemovedColumnOnBookmarkTable1783787760248'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."bookmarks_bookmark_type_enum" RENAME TO "bookmarks_bookmark_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."bookmarks_bookmark_type_enum" AS ENUM('product', 'business')`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ALTER COLUMN "bookmark_type" TYPE "public"."bookmarks_bookmark_type_enum" USING "bookmark_type"::"text"::"public"."bookmarks_bookmark_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bookmarks_bookmark_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bookmarks_bookmark_type_enum_old" AS ENUM('PRODUCT', 'BUSINESS')`);
        await queryRunner.query(`ALTER TABLE "bookmarks" ALTER COLUMN "bookmark_type" TYPE "public"."bookmarks_bookmark_type_enum_old" USING "bookmark_type"::"text"::"public"."bookmarks_bookmark_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."bookmarks_bookmark_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."bookmarks_bookmark_type_enum_old" RENAME TO "bookmarks_bookmark_type_enum"`);
    }

}

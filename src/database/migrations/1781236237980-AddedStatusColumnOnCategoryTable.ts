import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedStatusColumnOnCategoryTable1781236237980 implements MigrationInterface {
    name = 'AddedStatusColumnOnCategoryTable1781236237980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."categories_status_enum" AS ENUM('published', 'draft', 'archieved')`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "status" "public"."categories_status_enum" NOT NULL DEFAULT 'published'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."categories_status_enum"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedProductRatingTable1783914873251 implements MigrationInterface {
    name = 'CreatedProductRatingTable1783914873251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "customer_id" uuid NOT NULL, "score" smallint NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_f8bd94404fc1d160bdb075dc435" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_ratings" ADD CONSTRAINT "FK_538c9489e98d4874e8db0c4cafd" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_ratings" ADD CONSTRAINT "FK_c6dc229a8417e9112db5ae10b56" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_ratings" DROP CONSTRAINT "FK_c6dc229a8417e9112db5ae10b56"`);
        await queryRunner.query(`ALTER TABLE "product_ratings" DROP CONSTRAINT "FK_538c9489e98d4874e8db0c4cafd"`);
        await queryRunner.query(`DROP TABLE "product_ratings"`);
    }

}

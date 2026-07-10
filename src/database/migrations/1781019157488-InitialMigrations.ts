import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigrations1781019157488 implements MigrationInterface {
  name = 'InitialMigrations1781019157488';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "customer_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "profile_url" character varying, "phone_number" character varying, "user_id" uuid NOT NULL, CONSTRAINT "REL_99617dd6d452ad43dd992a7993" UNIQUE ("user_id"), CONSTRAINT "PK_ece08ee55cbe707d9f870907727" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "action" text NOT NULL, "email" character varying, "ip_address" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'vendor', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_auth_provider_type_enum" AS ENUM('google', 'facebook', 'email')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "status" "public"."users_status_enum" NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer', "auth_provider_type" "public"."users_auth_provider_type_enum" NOT NULL, "auth_provider_id" character varying, "refresh_token" text, "refresh_token_expiry_date" TIMESTAMP WITH TIME ZONE, "reset_password_token" text, "reset_password_token_expiry_date" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."vendor_profiles_vendor_status_enum" AS ENUM('approved', 'pending', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "vendor_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "business_name" text NOT NULL, "business_profile_url" character varying, "vendor_status" "public"."vendor_profiles_vendor_status_enum" NOT NULL DEFAULT 'pending', "rejection_reason" text, "approved_at" TIMESTAMP WITH TIME ZONE, "phone_number" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_193d7cc6d4254e2098da2eda45" UNIQUE ("user_id"), CONSTRAINT "PK_bcb47b1a47f4f1447447eaf73a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_profiles" ADD CONSTRAINT "FK_99617dd6d452ad43dd992a79933" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_profiles" ADD CONSTRAINT "FK_193d7cc6d4254e2098da2eda45b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_profiles" DROP CONSTRAINT "FK_193d7cc6d4254e2098da2eda45b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_profiles" DROP CONSTRAINT "FK_99617dd6d452ad43dd992a79933"`,
    );
    await queryRunner.query(`DROP TABLE "vendor_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."vendor_profiles_vendor_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP TYPE "public"."users_auth_provider_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "customer_profiles"`);
  }
}

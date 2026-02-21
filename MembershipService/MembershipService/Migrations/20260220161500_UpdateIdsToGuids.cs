using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MembershipService.Migrations
{
    /// <inheritdoc />
    public partial class UpdateIdsToGuids : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Enable uuid-ossp extension for UUID generation
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");

            // Safely drop foreign key constraints (only if they exist)
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT constraint_name FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_Checkins_Memberships_MembershipId') THEN
                        ALTER TABLE "Checkins" DROP CONSTRAINT "FK_Checkins_Memberships_MembershipId";
                    END IF;
                END $$;
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT constraint_name FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_Memberships_Packages_PackageId') THEN
                        ALTER TABLE "Memberships" DROP CONSTRAINT "FK_Memberships_Packages_PackageId";
                    END IF;
                END $$;
                """);

            // Drop indexes if they exist
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Checkins_MembershipId\"");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Memberships_PackageId\"");

            // Drop primary keys if they exist
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT constraint_name FROM information_schema.table_constraints 
                        WHERE constraint_name = 'PK_Packages') THEN
                        ALTER TABLE "Packages" DROP CONSTRAINT "PK_Packages";
                    END IF;
                    IF EXISTS (SELECT constraint_name FROM information_schema.table_constraints 
                        WHERE constraint_name = 'PK_Memberships') THEN
                        ALTER TABLE "Memberships" DROP CONSTRAINT "PK_Memberships";
                    END IF;
                    IF EXISTS (SELECT constraint_name FROM information_schema.table_constraints 
                        WHERE constraint_name = 'PK_Checkins') THEN
                        ALTER TABLE "Checkins" DROP CONSTRAINT "PK_Checkins";
                    END IF;
                END $$;
                """);

            // Drop IDENTITY constraints and convert columns to UUID
            migrationBuilder.Sql("ALTER TABLE \"Packages\" ALTER COLUMN \"PackageId\" DROP IDENTITY");
            migrationBuilder.Sql("ALTER TABLE \"Packages\" ALTER COLUMN \"PackageId\" TYPE uuid USING uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, (\"PackageId\"::text))");
            
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ALTER COLUMN \"MembershipId\" DROP IDENTITY");
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ALTER COLUMN \"MembershipId\" TYPE uuid USING uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c9'::uuid, (\"MembershipId\"::text))");
            
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ALTER COLUMN \"PackageId\" TYPE uuid USING uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, (\"PackageId\"::text))");
            
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ALTER COLUMN \"CheckinId\" DROP IDENTITY");
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ALTER COLUMN \"CheckinId\" TYPE uuid USING uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430ca'::uuid, (\"CheckinId\"::text))");
            
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ALTER COLUMN \"MembershipId\" TYPE uuid USING uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c9'::uuid, (\"MembershipId\"::text))");

            // Re-add primary keys
            migrationBuilder.Sql("ALTER TABLE \"Packages\" ADD CONSTRAINT \"PK_Packages\" PRIMARY KEY (\"PackageId\")");
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ADD CONSTRAINT \"PK_Memberships\" PRIMARY KEY (\"MembershipId\")");
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ADD CONSTRAINT \"PK_Checkins\" PRIMARY KEY (\"CheckinId\")");

            // Re-add foreign keys
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ADD CONSTRAINT \"FK_Memberships_Packages_PackageId\" FOREIGN KEY (\"PackageId\") REFERENCES \"Packages\" (\"PackageId\") ON DELETE RESTRICT");
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ADD CONSTRAINT \"FK_Checkins_Memberships_MembershipId\" FOREIGN KEY (\"MembershipId\") REFERENCES \"Memberships\" (\"MembershipId\") ON DELETE CASCADE");

            // Re-add indexes
            migrationBuilder.Sql("CREATE INDEX \"IX_Checkins_MembershipId\" ON \"Checkins\" (\"MembershipId\")");
            migrationBuilder.Sql("CREATE INDEX \"IX_Memberships_PackageId\" ON \"Memberships\" (\"PackageId\")");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key constraints first
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" DROP CONSTRAINT \"FK_Checkins_Memberships_MembershipId\"");
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" DROP CONSTRAINT \"FK_Memberships_Packages_PackageId\"");

            // Drop indexes
            migrationBuilder.Sql("DROP INDEX \"IX_Checkins_MembershipId\"");
            migrationBuilder.Sql("DROP INDEX \"IX_Memberships_PackageId\"");

            // Drop primary keys
            migrationBuilder.Sql("ALTER TABLE \"Packages\" DROP CONSTRAINT \"PK_Packages\"");
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" DROP CONSTRAINT \"PK_Memberships\"");
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" DROP CONSTRAINT \"PK_Checkins\"");

            // Convert back to integer with identity
            migrationBuilder.Sql("ALTER TABLE \"Packages\" ALTER COLUMN \"PackageId\" TYPE integer");
            migrationBuilder.Sql("ALTER TABLE \"Packages\" ALTER COLUMN \"PackageId\" SET DEFAULT nextval('\"Packages_PackageId_seq\"'::regclass)");
            migrationBuilder.Sql("CREATE SEQUENCE \"Packages_PackageId_seq\" START 1 INCREMENT 1");
            
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ALTER COLUMN \"MembershipId\" TYPE integer");
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ALTER COLUMN \"MembershipId\" SET DEFAULT nextval('\"Memberships_MembershipId_seq\"'::regclass)");
            migrationBuilder.Sql("CREATE SEQUENCE \"Memberships_MembershipId_seq\" START 1 INCREMENT 1");
            
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ALTER COLUMN \"PackageId\" TYPE integer");
            
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ALTER COLUMN \"CheckinId\" TYPE integer");
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ALTER COLUMN \"CheckinId\" SET DEFAULT nextval('\"Checkins_CheckinId_seq\"'::regclass)");
            migrationBuilder.Sql("CREATE SEQUENCE \"Checkins_CheckinId_seq\" START 1 INCREMENT 1");
            
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ALTER COLUMN \"MembershipId\" TYPE integer");

            // Re-add primary keys
            migrationBuilder.Sql("ALTER TABLE \"Packages\" ADD CONSTRAINT \"PK_Packages\" PRIMARY KEY (\"PackageId\")");
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ADD CONSTRAINT \"PK_Memberships\" PRIMARY KEY (\"MembershipId\")");
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ADD CONSTRAINT \"PK_Checkins\" PRIMARY KEY (\"CheckinId\")");

            // Re-add foreign keys
            migrationBuilder.Sql("ALTER TABLE \"Memberships\" ADD CONSTRAINT \"FK_Memberships_Packages_PackageId\" FOREIGN KEY (\"PackageId\") REFERENCES \"Packages\" (\"PackageId\") ON DELETE RESTRICT");
            migrationBuilder.Sql("ALTER TABLE \"Checkins\" ADD CONSTRAINT \"FK_Checkins_Memberships_MembershipId\" FOREIGN KEY (\"MembershipId\") REFERENCES \"Memberships\" (\"MembershipId\") ON DELETE CASCADE");

            // Re-add indexes
            migrationBuilder.Sql("CREATE INDEX \"IX_Checkins_MembershipId\" ON \"Checkins\" (\"MembershipId\")");
            migrationBuilder.Sql("CREATE INDEX \"IX_Memberships_PackageId\" ON \"Memberships\" (\"PackageId\")");
        }
    }
}

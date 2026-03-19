using Microsoft.EntityFrameworkCore.Migrations;

namespace CampusHostels.API.Migrations
{
    public abstract class SafeMigration : Migration
    {
        protected void CreateTableIfNotExists(MigrationBuilder migrationBuilder, string tableName, string createTableSql)
        {
            migrationBuilder.Sql($@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '{tableName.ToLower()}') THEN
                        {createTableSql}
                    END IF;
                END
                $$");
        }
        
        protected void CreateIndexIfNotExists(MigrationBuilder migrationBuilder, string indexName, string tableName, string createIndexSql)
        {
            migrationBuilder.Sql($@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '{indexName.ToLower()}') THEN
                        {createIndexSql}
                    END IF;
                END
                $$");
        }
    }
}
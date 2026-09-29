using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusHostels.API.Migrations
{
    /// <inheritdoc />
    public partial class AddManagerUsername : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Managers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Managers",
                keyColumn: "Id",
                keyValue: 1,
                column: "Username",
                value: "superadmin");

            // Backfill any other pre-existing manager rows (created before Username existed) with a
            // username derived from their email's local part, so the unique index below doesn't
            // collide on the "" default and every existing account still has a usable username.
            migrationBuilder.Sql(
                "UPDATE \"Managers\" SET \"Username\" = split_part(\"Email\", '@', 1) WHERE \"Username\" = '';");

            migrationBuilder.CreateIndex(
                name: "IX_Managers_Username",
                table: "Managers",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Managers_Username",
                table: "Managers");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Managers");
        }
    }
}

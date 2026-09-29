using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusHostels.API.Migrations
{
    /// <inheritdoc />
    public partial class AddManagerPasswordPolicy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastPasswordChangeAt",
                table: "Managers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "Managers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Every manager row that predates this column (including the bootstrap seed) has never
            // gone through the new change-password flow, so all of them must be forced to set a
            // password on next login — not just the seeded row.
            migrationBuilder.Sql(
                "UPDATE \"Managers\" SET \"MustChangePassword\" = true WHERE \"LastPasswordChangeAt\" IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastPasswordChangeAt",
                table: "Managers");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "Managers");
        }
    }
}

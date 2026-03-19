using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CampusHostels.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActive : SafeMigration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BedsLeft",
                table: "Units",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "TenancyAgreements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // migrationBuilder.AddUniqueConstraint(
            //     name: "AK_Users_TenantId",
            //     table: "Users",
            //     column: "TenantId");

            // migrationBuilder.CreateTable(
            //     name: "PasswordResetTokens",
            //     columns: table => new
            //     {
            //         Id = table.Column<int>(type: "integer", nullable: false)
            //             .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            //         UserId = table.Column<int>(type: "integer", nullable: false),
            //         TokenHash = table.Column<string>(type: "text", nullable: false),
            //         ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            //         Used = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
            //         CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
            //         table.ForeignKey(
            //             name: "FK_PasswordResetTokens_Users_UserId",
            //             column: x => x.UserId,
            //             principalTable: "Users",
            //             principalColumn: "Id",
            //             onDelete: ReferentialAction.Cascade);
            //     });

            // migrationBuilder.CreateIndex(
            //     name: "IX_TenancyAgreements_TenantId",
            //     table: "TenancyAgreements",
            //     column: "TenantId");

            // migrationBuilder.CreateIndex(
            //     name: "IX_PasswordResetTokens_TokenHash",
            //     table: "PasswordResetTokens",
            //     column: "TokenHash");

            // migrationBuilder.CreateIndex(
            //     name: "IX_PasswordResetTokens_UserId",
            //     table: "PasswordResetTokens",
            //     column: "UserId");

            // migrationBuilder.AddForeignKey(
            //     name: "FK_TenancyAgreements_Users_TenantId",
            //     table: "TenancyAgreements",
            //     column: "TenantId",
            //     principalTable: "Users",
            //     principalColumn: "TenantId",
            //     onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropForeignKey(
            //     name: "FK_TenancyAgreements_Users_TenantId",
            //     table: "TenancyAgreements");

            // migrationBuilder.DropTable(
            //     name: "PasswordResetTokens");

            // migrationBuilder.DropUniqueConstraint(
            //     name: "AK_Users_TenantId",
            //     table: "Users");

            // migrationBuilder.DropIndex(
            //     name: "IX_TenancyAgreements_TenantId",
            //     table: "TenancyAgreements");

            migrationBuilder.DropColumn(
                name: "BedsLeft",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "TenancyAgreements");
        }
    }
}

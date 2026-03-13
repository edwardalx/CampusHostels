using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusHostels.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddUniqueConstraint(
                name: "AK_Users_TenantId",
                table: "Users",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TenancyAgreements_TenantId",
                table: "TenancyAgreements",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_TenancyAgreements_Users_TenantId",
                table: "TenancyAgreements",
                column: "TenantId",
                principalTable: "Users",
                principalColumn: "TenantId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TenancyAgreements_Users_TenantId",
                table: "TenancyAgreements");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Users_TenantId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_TenancyAgreements_TenantId",
                table: "TenancyAgreements");
        }
    }
}

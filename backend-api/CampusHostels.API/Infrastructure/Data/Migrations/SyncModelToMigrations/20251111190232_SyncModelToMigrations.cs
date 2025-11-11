using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusHostels.API.Infrastructure.Data.Migrations.SyncModelToMigrations
{
    /// <inheritdoc />
    public partial class SyncModelToMigrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_TenancyAgreements_TenancyAgreementId1",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_TenancyAgreementId1",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "TenancyAgreementId1",
                table: "Payments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TenancyAgreementId1",
                table: "Payments",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TenancyAgreementId1",
                table: "Payments",
                column: "TenancyAgreementId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_TenancyAgreements_TenancyAgreementId1",
                table: "Payments",
                column: "TenancyAgreementId1",
                principalTable: "TenancyAgreements",
                principalColumn: "Id");
        }
    }
}

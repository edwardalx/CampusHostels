using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusHostels.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerManagerId",
                table: "Properties",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Managers_ManagerId",
                table: "Managers",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_OwnerManagerId",
                table: "Properties",
                column: "OwnerManagerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_Managers_OwnerManagerId",
                table: "Properties",
                column: "OwnerManagerId",
                principalTable: "Managers",
                principalColumn: "ManagerId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_Managers_OwnerManagerId",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_OwnerManagerId",
                table: "Properties");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Managers_ManagerId",
                table: "Managers");

            migrationBuilder.DropColumn(
                name: "OwnerManagerId",
                table: "Properties");
        }
    }
}

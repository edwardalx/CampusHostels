using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusHostels.API.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDomainEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Properties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    NoOfUnits = table.Column<int>(type: "INTEGER", nullable: true),
                    NoOfFloors = table.Column<int>(type: "INTEGER", nullable: true),
                    Availability = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Properties", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PropertyId = table.Column<int>(type: "INTEGER", nullable: false),
                    Floor = table.Column<int>(type: "INTEGER", nullable: false),
                    RoomNumber = table.Column<string>(type: "TEXT", nullable: true),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    Cost = table.Column<int>(type: "INTEGER", nullable: true),
                    MaxNoOfPeople = table.Column<int>(type: "INTEGER", nullable: true),
                    Availability = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    UnitType = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Units_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Images",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PropertyId = table.Column<int>(type: "INTEGER", nullable: true),
                    UnitId = table.Column<int>(type: "INTEGER", nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    PhotoUrl = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Images", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Images_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Images_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TenancyAgreements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ContractStartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ContractDurationMonths = table.Column<int>(type: "INTEGER", nullable: false),
                    ContractEndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TenantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PropertyId = table.Column<int>(type: "INTEGER", nullable: false),
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalAmountPaid = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenancyAgreements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenancyAgreements_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenancyAgreements_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<int>(type: "INTEGER", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", nullable: false),
                    Phone = table.Column<string>(type: "TEXT", nullable: true),
                    Provider = table.Column<int>(type: "INTEGER", nullable: false),
                    Reference = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Channel = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UnitId = table.Column<int>(type: "INTEGER", nullable: false),
                    TenantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TenancyAgreementId = table.Column<int>(type: "INTEGER", nullable: true),
                    TenancyAgreementId1 = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_TenancyAgreements_TenancyAgreementId",
                        column: x => x.TenancyAgreementId,
                        principalTable: "TenancyAgreements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Payments_TenancyAgreements_TenancyAgreementId1",
                        column: x => x.TenancyAgreementId1,
                        principalTable: "TenancyAgreements",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Payments_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PaymentSummaries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenancyAgreementId = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalAmountPaid = table.Column<int>(type: "INTEGER", nullable: false),
                    AmountLeft = table.Column<int>(type: "INTEGER", nullable: false),
                    LastPaymentDate = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentSummaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentSummaries_TenancyAgreements_TenancyAgreementId",
                        column: x => x.TenancyAgreementId,
                        principalTable: "TenancyAgreements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Images_PropertyId",
                table: "Images",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_Images_UnitId",
                table: "Images",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Reference",
                table: "Payments",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TenancyAgreementId",
                table: "Payments",
                column: "TenancyAgreementId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TenancyAgreementId1",
                table: "Payments",
                column: "TenancyAgreementId1");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UnitId",
                table: "Payments",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentSummaries_TenancyAgreementId",
                table: "PaymentSummaries",
                column: "TenancyAgreementId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Properties_Name",
                table: "Properties",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TenancyAgreements_PropertyId",
                table: "TenancyAgreements",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_TenancyAgreements_UnitId",
                table: "TenancyAgreements",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_PropertyId_RoomNumber",
                table: "Units",
                columns: new[] { "PropertyId", "RoomNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Images");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PaymentSummaries");

            migrationBuilder.DropTable(
                name: "TenancyAgreements");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropTable(
                name: "Properties");
        }
    }
}

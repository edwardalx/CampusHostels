using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampusHostels.API.Migrations
{
    /// <inheritdoc />
    public partial class LockSeededSuperAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The model no longer seeds a Super Manager, so the scaffolder wanted to DELETE the seeded row.
            // Deleting could remove the only admin from a live database, so instead neutralise it:
            // if (and only if) the account still carries the password that was documented in the source
            // code, replace it with a marker no password can ever match and force a change.
            // An account whose password was already changed is left untouched.
            // Recovery: set Bootstrap__SuperManagerPassword (see SuperManagerBootstrap).
            migrationBuilder.Sql(
                "UPDATE \"Managers\" SET \"PasswordHash\" = '!locked', \"MustChangePassword\" = TRUE, " +
                "\"FailedLoginAttempts\" = 0, \"UpdatedAt\" = NOW() " +
                "WHERE \"ManagerId\" = '11111111-1111-1111-1111-111111111111' " +
                "AND \"PasswordHash\" = 'hDgl6VBbn//EPILc2W7vuugsmjjjrXbroJhcpZe3dpY=';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty: never restore a publicly documented password.
        }
    }
}

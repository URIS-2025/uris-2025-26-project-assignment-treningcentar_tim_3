using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReservationService.Migrations
{
    public partial class IdIntToGuid : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Sessions
            migrationBuilder.DropColumn(
                name: "trainerId",
                table: "Sessions");

            migrationBuilder.AddColumn<Guid>(
                name: "trainerId",
                table: "Sessions",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty);

            // Reservations
            migrationBuilder.DropColumn(
                name: "userId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "sessionId",
                table: "Reservations");

            migrationBuilder.AddColumn<Guid>(
                name: "userId",
                table: "Reservations",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty);

            migrationBuilder.AddColumn<Guid>(
                name: "sessionId",
                table: "Reservations",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Sessions
            migrationBuilder.DropColumn(
                name: "trainerId",
                table: "Sessions");

            migrationBuilder.AddColumn<int>(
                name: "trainerId",
                table: "Sessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Reservations
            migrationBuilder.DropColumn(
                name: "userId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "sessionId",
                table: "Reservations");

            migrationBuilder.AddColumn<int>(
                name: "userId",
                table: "Reservations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "sessionId",
                table: "Reservations",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
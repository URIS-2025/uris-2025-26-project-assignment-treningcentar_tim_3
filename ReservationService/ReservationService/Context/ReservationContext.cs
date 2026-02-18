using Microsoft.EntityFrameworkCore;
using ReservationService.Models;

namespace ReservationService.Context
{
    public class ReservationContext : DbContext
    {
        private readonly IConfiguration _configuration;

        public ReservationContext(
            DbContextOptions<ReservationContext> options,
            IConfiguration configuration) : base(options)
        {
            _configuration = configuration;
        }

        // DbSet-ovi
        public DbSet<Reservation> Reservations { get; set; } = default!;
        public DbSet<Session> Sessions { get; set; } = default!;
        public DbSet<TrainingHall> TrainingHalls { get; set; } = default!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Connection string iz appsettings.json
            optionsBuilder.UseNpgsql(_configuration.GetConnectionString("ReservationDB"));
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            // Ako imaš inicijalne podatke (seeding)
            builder.Entity<TrainingHall>().HasData(
                
            );

            builder.Entity<Session>().HasData(
                new
                {
                    Id = Guid.Parse("c3333333-3333-3333-3333-333333333333"),
                    TrainingType = Models.Enums.TrainingType.Strength,
                    MaxCapacity = 10
                }
            );

            builder.Entity<Reservation>().HasData(
                );
        }
    }
}

using Microsoft.EntityFrameworkCore;
using ReservationService.Models;

namespace ReservationService.Context
{
    public class ReservationContext : DbContext
    {
        private readonly IConfiguration _configuration;

        public ReservationContext(DbContextOptions<ReservationContext> options, IConfiguration configuration) : base(options)
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
            optionsBuilder.UseNpgsql(_configuration.GetConnectionString("DefaultConnection"));
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            // seeding
            builder.Entity<TrainingHall>().HasData();

            builder.Entity<Session>()
                .HasDiscriminator<string>("SessionType")
                .HasValue<PersonalSession>("Personal")
                .HasValue<GroupSession>("Group");

            builder.Entity<Reservation>().HasData();
        }
    }
}

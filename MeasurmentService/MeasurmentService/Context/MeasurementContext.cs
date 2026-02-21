using MeasurmentService.Models;
using Microsoft.EntityFrameworkCore;

namespace MeasurmentService.Context
{
    public class MeasurementContext : DbContext
    {
        public MeasurementContext(DbContextOptions<MeasurementContext> options)
            : base(options) { }

        public DbSet<MeasurementAppointment> MeasurementAppointments => Set<MeasurementAppointment>();
        public DbSet<Guideline> Guidelines => Set<Guideline>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MeasurementAppointment>()
                .OwnsOne(x => x.Measurements);

            // 1:1: MeasurementAppointment -> Guideline
            // Guideline.AppointmentId je FK i unique po definiciji 1:1
            modelBuilder.Entity<MeasurementAppointment>()
                .HasOne(a => a.Guideline)
                .WithOne(g => g.MeasurementAppointment)
                .HasForeignKey<Guideline>(g => g.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Guideline>()
                .HasIndex(g => g.AppointmentId)
                .IsUnique();
        }
    }
}
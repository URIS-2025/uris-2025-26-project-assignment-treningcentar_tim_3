using MeasurmentService.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

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

            modelBuilder.Entity<MeasurementAppointment>()
                .HasOne(x => x.Guideline)
                .WithMany()
                .HasForeignKey(x => x.GuidelineId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}

using Microsoft.EntityFrameworkCore;
using ServiceService.Domain.Entities;

namespace ServiceService.Infrastructure.Persistence
{
    public class ServiceDbContext : DbContext
    {
        public ServiceDbContext(DbContextOptions<ServiceDbContext> options) : base(options) { }

        public DbSet<Service> Services => Set<Service>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Service>(entity =>
            {
                entity.ToTable("services");
                entity.HasKey(x => x.ServiceId);

                entity.Property(x => x.Name)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(x => x.Description)
                    .HasMaxLength(2000);

                entity.Property(x => x.Price)
                    .HasPrecision(12, 2);

                entity.Property(x => x.Category)
                    .IsRequired();
            });
        }
    }
}

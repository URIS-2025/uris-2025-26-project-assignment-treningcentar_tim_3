using Microsoft.EntityFrameworkCore;
using MembershipService.Models;

namespace MembershipService.Context;

public class MembershipContext : DbContext
{
    public MembershipContext(DbContextOptions<MembershipContext> options) : base(options)
    {
    }

    public DbSet<Membership> Memberships { get; set; }

    public DbSet<Package> Packages { get; set; }

    public DbSet<Checkin> Checkins { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Konfiguracija odnosa između Membership i Package
        modelBuilder.Entity<Membership>()
            .HasOne(m => m.Package)
            .WithMany()
            .HasForeignKey(m => m.PackageId)
            .OnDelete(DeleteBehavior.Restrict);

        // Konfiguracija odnosa između Membership i Checkin
        modelBuilder.Entity<Membership>()
            .HasMany(m => m.Checkins)
            .WithOne(c => c.Membership)
            .HasForeignKey(c => c.MembershipId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}

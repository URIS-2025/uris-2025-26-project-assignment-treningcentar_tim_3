using Microsoft.EntityFrameworkCore;
using AuthService.Models;


namespace AuthService.Data
{
    public class AuthDbContext : DbContext
    {
        public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
        {
        }
        public DbSet<UserEntity> Users { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Da ne budu brojevi u bazi
            builder.Entity<UserEntity>()
                   .Property(u => u.Role)
                   .HasConversion<string>();
        }

    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AuthService.Data
{
    public class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
    {
        public AuthDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AuthDbContext>();

            // Prefer environment variable in CI/locally, fallback to a sensible local connection string.
            var conn = Environment.GetEnvironmentVariable("AUTHDB_CONNECTION")
                       ?? "Host=localhost;Port=5432;Database=AuthDb;Username=markoisajlovic;Password=postgres";

            optionsBuilder.UseNpgsql(conn);

            return new AuthDbContext(optionsBuilder.Options);
        }
    }
}

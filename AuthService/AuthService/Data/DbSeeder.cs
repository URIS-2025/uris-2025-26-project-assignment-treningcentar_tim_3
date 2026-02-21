using AuthService.Data;
using AuthService.Helpers;
using AuthService.Models;

public static class DbSeeder
{
    public static void SeedAdmin(AuthDbContext context)
    {
        if (!context.Users.Any(u => u.Role == Role.Admin))
        {
            var admin = new UserEntity
            {
                Username = "admin",
                Email = "admin@example.com",
                PasswordHash = PasswordHelper.HashPassword("Admin123"), // default password
                Role = Role.Admin,
                FirstName = "System",
                LastName = "Administrator"
            };

            context.Users.Add(admin);
            context.SaveChanges();
        }
    }
}

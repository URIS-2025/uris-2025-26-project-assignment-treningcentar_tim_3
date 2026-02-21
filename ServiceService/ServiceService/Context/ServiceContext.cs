using Microsoft.EntityFrameworkCore;
using ServiceService.Models;

namespace ServiceService.Context
{
    public class ServiceContext : DbContext
    {
        private readonly IConfiguration _configuration;

        public ServiceContext(DbContextOptions options, IConfiguration configuration)
            : base(options)
        {
            _configuration = configuration;
        }

        public DbSet<Service> Services { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseNpgsql(_configuration.GetConnectionString("DefaultConnection"));
        }
    }
}
using LoggerService.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace LoggerService.Context
{
    public class LoggerContext : DbContext
    {
        private readonly IConfiguration _configuration;

        public LoggerContext(DbContextOptions options, IConfiguration configuration)
            : base(options)
        {
            _configuration = configuration;
        }

        public DbSet<LogEntry> Logs { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseNpgsql(_configuration.GetConnectionString("DefaultConnection"));
        }
    }
}

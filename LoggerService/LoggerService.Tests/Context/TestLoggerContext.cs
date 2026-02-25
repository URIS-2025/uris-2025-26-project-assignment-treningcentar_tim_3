using LoggerService.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;


namespace LoggerService.Tests.Context
{
    public class TestLoggerContext : LoggerContext
    {
        public TestLoggerContext(DbContextOptions options, IConfiguration configuration)
           : base(options, configuration)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // provider dolazi iz DbContextOptions (SQLite/InMemory)
        }
    }
}

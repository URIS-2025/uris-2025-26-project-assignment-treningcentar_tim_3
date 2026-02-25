using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PaymentService.Context;

namespace PaymentService.Tests
{
    /// Test verzija PaymentContext-a koja koristi InMemory bazu
    public class TestPaymentContext : PaymentContext
    {
        public TestPaymentContext(DbContextOptions options)
            : base(options, new ConfigurationBuilder().Build())
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Preskoci UseNpgsql
        }
    }
}

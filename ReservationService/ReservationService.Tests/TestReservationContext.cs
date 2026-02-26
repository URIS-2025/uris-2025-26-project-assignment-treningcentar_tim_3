using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ReservationService.Context;

namespace ReservationService.Tests
{
    public class TestReservationContext : ReservationContext
    {
        public TestReservationContext(DbContextOptions<ReservationContext> options)
            : base(options, new ConfigurationBuilder().Build())
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // ne koristi Npgsql u testovima
        }
    }
}

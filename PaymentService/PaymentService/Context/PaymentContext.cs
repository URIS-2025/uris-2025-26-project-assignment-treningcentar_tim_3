using Microsoft.EntityFrameworkCore;
using PaymentService.Models;

namespace PaymentService.Context
{
    public class PaymentContext :DbContext
    {
        public PaymentContext(DbContextOptions<PaymentContext> options)
            : base(options)
        {
        }

        public DbSet<Payment> Payments { get; set; }
    }
}

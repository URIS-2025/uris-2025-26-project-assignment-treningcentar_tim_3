
using PaymentService.Models.Enums;


namespace PaymentService.Models
{
    public class Payment
    {
        public Guid Id { get; set; }

        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; }

        public PaymentMethod Method { get; set; }

        public PaymentStatus Status { get; set; }

        public Guid ServiceId { get; set; }

        public string? StripePaymentIntentId { get; set; }
    }
}

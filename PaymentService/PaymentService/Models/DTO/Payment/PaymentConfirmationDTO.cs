using PaymentService.Models.Enums;

namespace PaymentService.Models.DTO.Payment
{
    public class PaymentConfirmationDTO
    {
        public Guid PaymentId { get; set; }
        public PaymentStatus Status { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public PaymentMethod Method { get; set; }
        public string? ClientSecret { get; set; }
    }
}

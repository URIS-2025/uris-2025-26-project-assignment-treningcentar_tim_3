using PaymentService.Models.Enums;

namespace PaymentService.Models.DTO.Payment
{
    public class PaymentDTO
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public PaymentMethod Method { get; set; }
        public PaymentStatus Status { get; set; }
        public Guid ServiceId { get; set; }
    }
}

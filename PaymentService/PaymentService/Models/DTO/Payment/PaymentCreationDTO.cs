using System.ComponentModel.DataAnnotations;
using PaymentService.Models.Enums;

namespace PaymentService.Models.DTO.Payment
{
    public class PaymentCreationDTO
    {
        [Required(ErrorMessage = "Amount is required.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0.")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Payment date is required.")]
        public DateTime PaymentDate { get; set; }

        [Required(ErrorMessage = "Payment method is required.")]
        [EnumDataType(typeof(PaymentMethod))]
        public PaymentMethod Method { get; set; }
        
        [Required(ErrorMessage = "Service ID is required.")]
        public Guid ServiceId { get; set; }
    }
}

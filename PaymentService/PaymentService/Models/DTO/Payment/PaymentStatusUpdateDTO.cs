using System.ComponentModel.DataAnnotations;
using PaymentService.Models.Enums;

namespace PaymentService.Models.DTO.Payment
{
    public class PaymentStatusUpdateDTO
    {
        [Required(ErrorMessage = "Id is required.")]
        public Guid Id { get; set; }

        [Required(ErrorMessage = "Status is required.")]
        [EnumDataType(typeof(PaymentStatus))]
        public PaymentStatus Status { get; set; }
    }
}

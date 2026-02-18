using System.ComponentModel.DataAnnotations;
using PaymentService.Models.Enums;


namespace PaymentService.Models.DTO
{
    /// DTO za ažuriranje statusa plaćanja.
    public class PaymentStatusUpdateDTO
    {
        /// Novi status plaćanja.
       [Required(ErrorMessage = "Status is required.")]
        public PaymentStatus Status { get; set; }
    }
}

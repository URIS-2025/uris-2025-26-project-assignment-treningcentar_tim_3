using System.ComponentModel.DataAnnotations;
using PaymentService.Models.Enums;


namespace PaymentService.Models.DTO
{
    /// DTO za ažuriranje statusa plaćanja.
    public class PaymentStatusUpdateDTO
    {
        ///Id placanja koji se azurira 
        [Required(ErrorMessage = "Id is required.")]
        public Guid Id { get; set; }
        /// Novi status plaćanja.
        [Required(ErrorMessage = "Status is required.")]
        [EnumDataType(typeof(PaymentStatus))]
        public PaymentStatus Status { get; set; }
    }
}

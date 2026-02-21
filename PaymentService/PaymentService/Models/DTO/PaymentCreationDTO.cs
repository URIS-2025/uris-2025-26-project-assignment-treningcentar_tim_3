using System;
using System.ComponentModel.DataAnnotations;
using PaymentService.Models.Enums;


namespace PaymentService.Models.DTO
{
    /// DTO za kreiranje plaćanja.
    public class PaymentCreationDTO
    {
      
        /// Iznos plaćanja.
        [Required(ErrorMessage = "Amount is required.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0.")]
        public decimal Amount { get; set; }

      
        /// Datum plaćanja.
        [Required(ErrorMessage = "Payment date is required.")]
        public DateTime PaymentDate { get; set; }

    
        /// Način plaćanja.
        [Required(ErrorMessage = "Payment method is required.")]
        [EnumDataType(typeof(PaymentMethod))]
        public PaymentMethod Method { get; set; }

        /// ID rezervacije.
        [Required(ErrorMessage = "Reservation ID is required.")]
        public Guid ReservationId { get; set; }

        /// <summary>    /// ID servisa.
        [Required(ErrorMessage = "Service ID is required.")]
        public Guid ServiceId { get; set; }
    }
}

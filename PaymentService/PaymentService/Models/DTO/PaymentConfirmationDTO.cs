using System;
using PaymentService.Models.Enums;

namespace PaymentService.Models.DTO
{
    /// DTO za potvrdu kreiranog/izmenjenog plaćanja.
    public class PaymentConfirmationDTO
    {
        /// ID plaćanja.
        public Guid PaymentId { get; set; }

        /// Status plaćanja.
        public PaymentStatus Status { get; set; }

        /// Iznos plaćanja.
        public decimal Amount { get; set; }

        /// Datum plaćanja.
        public DateTime PaymentDate { get; set; }

        /// Način plaćanja.
        public PaymentMethod Method { get; set; }
    }
}

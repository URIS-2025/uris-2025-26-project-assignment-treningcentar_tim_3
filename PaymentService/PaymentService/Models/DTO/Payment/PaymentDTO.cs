using System;
using PaymentService.Models.Enums;

namespace PaymentService.Models.DTO.Payment
{
    public class PaymentDTO
    {
        /// ID plaćanja.
        public Guid Id { get; set; }

        /// Iznos plaćanja.
        public decimal Amount { get; set; }

        /// Datum plaćanja.
        public DateTime PaymentDate { get; set; }

        /// Način plaćanja.
        public PaymentMethod Method { get; set; }

        /// Status plaćanja.
        public PaymentStatus Status { get; set; }

        /// ID servisa.
        public Guid ServiceId { get; set; }
    }
}

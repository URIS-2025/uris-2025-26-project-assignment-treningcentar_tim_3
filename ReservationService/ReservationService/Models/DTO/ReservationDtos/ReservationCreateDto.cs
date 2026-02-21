using ReservationService.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace ReservationService.Models.DTO
{
    public class ReservationCreateDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid SessionId { get; set; }
    }
}
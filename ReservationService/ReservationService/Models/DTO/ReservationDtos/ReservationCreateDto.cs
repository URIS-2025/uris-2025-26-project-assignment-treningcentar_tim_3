using ReservationService.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace ReservationService.Models.DTO
{
    public class ReservationCreateDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int SessionId { get; set; }
    }
}
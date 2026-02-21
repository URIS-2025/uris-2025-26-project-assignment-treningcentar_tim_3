using System.ComponentModel.DataAnnotations;

namespace ReservationService.Models.DTO
{
    public class TrainingHallCreateDto
    {
        [Required]
        public string TrainingHallName { get; set; }
        public string? Description { get; set; }
        [Required]
        public int Capacity { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;

namespace ReservationService.Models.DTO;

public class TrainingHallUpdateDto
{
    [Required]
    public Guid TrainingHallId { get; set; }
    public string TrainingHallName { get; set; }
    public string? Description { get; set; }
    public int Capacity { get; set; }
}
using System.ComponentModel.DataAnnotations;
using ReservationService.Models.Enums;

public class SessionConfirmationDto
{
    [Required]
    public string Name { get; set; }
    [Required]
    public DateTime StartTime { get; set; }
    [Required]
    public DateTime EndTime { get; set; }
    [Required]
    public SessionStatus Status { get; set; }
    [Required]
    public TrainingType TrainingType { get; set; }
    [Required]
    public string TrainerName { get; set; }  // FirstName + LastName iz UserService

    // Samo za GroupSession
    public int? MaxCapacity { get; set; }
    public Guid? TrainingHallId { get; set; }
    public string? TrainingHallName { get; set; }
}
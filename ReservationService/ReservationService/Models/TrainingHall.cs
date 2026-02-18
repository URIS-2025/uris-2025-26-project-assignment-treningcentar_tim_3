namespace ReservationService.Models;

public class TrainingHall
{
    public Guid trainingHallId { get; set; }
    public string trainingHallName { get; set; }
    public string? Description { get; set; }
}
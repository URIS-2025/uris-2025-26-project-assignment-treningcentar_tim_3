namespace ReservationService.Models.DTO;

public class TrainingHallConfirmationDto
{
    public Guid TrainingHallId { get; set; }
    public string TrainingHallName { get; set; }
    public int Capacity { get; set; }
}
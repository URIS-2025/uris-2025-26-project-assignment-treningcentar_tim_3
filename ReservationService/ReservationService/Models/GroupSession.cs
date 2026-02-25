namespace ReservationService.Models;

public class GroupSession : Session
{
    public int maxCapacity { get; set; }
    public Guid trainingHallId { get; set; }
}
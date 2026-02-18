namespace ReservationService.Models;

public class GroupSession : Session
{
    public int maxCapacity { get; set; }
    public int hallId { get; set; }
}
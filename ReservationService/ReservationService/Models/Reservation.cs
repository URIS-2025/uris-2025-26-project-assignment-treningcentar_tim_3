using ReservationService.Models.Enums;

namespace ReservationService.Models;

public class Reservation
{
    public Guid reservationId { get; set; }
    public int userId  { get; set; }
    public int sessionId { get; set; }
    public ReservationStatus status { get; set; }
}
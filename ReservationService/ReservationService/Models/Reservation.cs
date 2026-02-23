using ReservationService.Models.Enums;

namespace ReservationService.Models;

public class Reservation
{
    public Guid reservationId { get; set; }
    public Guid userId  { get; set; }
    public Guid sessionId { get; set; }
    public ReservationStatus status { get; set; }
}
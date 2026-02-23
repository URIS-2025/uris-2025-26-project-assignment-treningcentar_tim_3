using ReservationService.Models.Enums;

public class ReservationUpdateDto
{
    public Guid ReservationId { get; set; }
    public Guid UserId { get; set; }
    public Guid SessionId { get; set; }
    public ReservationStatus Status { get; set; }
}
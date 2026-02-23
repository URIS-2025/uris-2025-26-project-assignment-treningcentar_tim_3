using ReservationService.Models.Enums;

namespace ReservationService.Models.DTO;

public class ReservationConfirmationDto
{
    public string UserName { get; set; }
    public Guid SessionId { get; set; }
    public ReservationStatus Status { get; set; }
}
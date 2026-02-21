using ReservationService.Models.Enums;

namespace ReservationService.Models.DTO
{
    public class ReservationDto
    {
        public Guid ReservationId { get; set; }
        public int UserId { get; set; }
        public int SessionId { get; set; }
        public ReservationStatus Status { get; set; }
    }
}
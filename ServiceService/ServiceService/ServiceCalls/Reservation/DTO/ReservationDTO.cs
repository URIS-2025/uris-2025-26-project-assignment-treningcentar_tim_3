using ServiceService.ServiceCalls.Reservation.DTO;
using ServiceService.ServiceCalls.Reservation.Enums;

namespace ServiceService.ServiceCalls.Reservation.DTO
{
    public class ReservationDTO
    {
        public Guid ReservationId { get; set; }
        public int UserId { get; set; }
        public int SessionId { get; set; }
        public ReservationStatus Status { get; set; }


    }
}
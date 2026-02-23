using ServiceService.ServiceCalls.Reservation.DTO;

namespace ServiceService.ServiceCalls.Reservation
{
    public interface IReservationService
    {
        ReservationDTO GetReservationById(Guid id);
    }
}
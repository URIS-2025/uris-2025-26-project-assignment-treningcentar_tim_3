using ReservationService.Models;
using ReservationService.Models.DTO;

namespace ReservationService.Data
{
    public interface IReservationRepository
    {
        ReservationDto? GetReservationById(Guid id);
        IEnumerable<ReservationDto> GetAllReservations();
        ReservationConfirmationDto CreateReservation(ReservationCreateDto reservation);
        ReservationConfirmationDto UpdateReservation(ReservationUpdateDto reservation);
        void DeleteReservation(Guid id);
        bool SaveChanges();
    }
}
using ReservationService.Models;

namespace ReservationService.Data
{
    public interface IReservationRepository
    {
        Reservation? GetReservationById(Guid id);
        IEnumerable<Reservation> GetAllReservations();
        void CreateReservation(Reservation reservation);
        void UpdateReservation(Reservation reservation);
        void DeleteReservation(Reservation reservation);
        bool SaveChanges();
    }
}
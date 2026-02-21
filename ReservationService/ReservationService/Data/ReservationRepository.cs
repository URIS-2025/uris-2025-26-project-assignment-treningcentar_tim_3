using AutoMapper;
using ReservationService.Context;
using ReservationService.Models;

namespace ReservationService.Data
{
    public class ReservationRepository : IReservationRepository
    {
        
        private readonly ReservationContext _context;
        // ovde registrovati druge service
        private readonly IMapper _mapper;

        public ReservationRepository(ReservationContext context, IMapper mapper)
        {
            _context = context;
            // _studentService = studentService;
            // _subjectService = subjectService;
            _mapper = mapper;
        }

        
        // inicijalna verzija dok se ne uklopi sa pravim servisima
        private readonly List<Reservation> _reservations = new();

        public IEnumerable<Reservation> GetAllReservations()
        {
            return _reservations;
        }

        public Reservation? GetReservationById(Guid id)
        {
            return _reservations.FirstOrDefault(r => r.reservationId == id);
        }

        public void CreateReservation(Reservation reservation)
        {
            _reservations.Add(reservation);
        }

        public void UpdateReservation(Reservation reservation)
        {
        }

        public void DeleteReservation(Reservation reservation)
        {
            _reservations.Remove(reservation);
        }

        public bool SaveChanges()
        {
            return true;
        }
    }
}
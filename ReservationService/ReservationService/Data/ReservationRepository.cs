using AutoMapper;
using ReservationService.Context;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Models.Enums;
using ReservationService.ServiceCalls.User;

namespace ReservationService.Data
{
    public class ReservationRepository : IReservationRepository
    {
        private readonly ReservationContext _context;
        private readonly IMapper _mapper;
        private readonly IUserService _userService;

        public ReservationRepository(ReservationContext context, IMapper mapper, IUserService userService)
        {
            _context = context;
            _mapper = mapper;
            _userService = userService;
        }

        public bool SaveChanges()
        {
            return _context.SaveChanges() > 0;
        }

        public IEnumerable<ReservationDto> GetAllReservations()
        {
            var reservations = _context.Reservations.ToList();
            var result = new List<ReservationDto>();

            foreach (var reservation in reservations)
            {
                var dto = _mapper.Map<ReservationDto>(reservation);
                dto.Member = _userService.GetMemberById(reservation.userId);
                result.Add(dto);
            }

            return result;
        }

        public ReservationDto? GetReservationById(Guid id)
        {
            var reservation = _context.Reservations.FirstOrDefault(r => r.reservationId == id);
            if (reservation == null)
            {
                return null;
            }
            
            var dto = _mapper.Map<ReservationDto>(reservation);
            dto.Member = _userService.GetMemberById(reservation.userId);

            return dto;
        }

        public ReservationConfirmationDto CreateReservation(ReservationCreateDto reservationDto)
        {
            // check if user exist
            var user = _userService.GetMemberById(reservationDto.UserId);
            if (user == null)
                throw new KeyNotFoundException($"User with ID {reservationDto.UserId} not found.");

            
            var newReservation = new Reservation
            {
                reservationId = Guid.NewGuid(),
                userId = reservationDto.UserId,
                sessionId =  reservationDto.SessionId,
                status = ReservationStatus.Booked
                
            };

            _context.Reservations.Add(newReservation);
            _context.SaveChanges();
            
            return new ReservationConfirmationDto
            {
                UserName = user.FirstName + " " + user.LastName,
                SessionId = reservationDto.SessionId
            };
        }

        public ReservationConfirmationDto UpdateReservation(ReservationUpdateDto reservationDto)
        {
            var existing = _context.Reservations.FirstOrDefault(r => r.reservationId == reservationDto.ReservationId);
            var user = _userService.GetMemberById(reservationDto.UserId);
            
            if (existing != null)
            {
                existing.userId = reservationDto.UserId;
                existing.sessionId = reservationDto.SessionId;
                existing.status = reservationDto.Status;
                
                _context.SaveChanges();
            }

            

            return new ReservationConfirmationDto
            {
                UserName = user.FirstName + " " + user.LastName,
                SessionId = reservationDto.SessionId,
                Status =  reservationDto.Status
            };
        }

        public void DeleteReservation(Guid id)
        {
            var reservation = _context.Reservations.FirstOrDefault(r => r.reservationId == id);
            if (reservation != null)
            {
                _context.Remove(reservation);
                _context.SaveChanges();
            }
        }
    }
}
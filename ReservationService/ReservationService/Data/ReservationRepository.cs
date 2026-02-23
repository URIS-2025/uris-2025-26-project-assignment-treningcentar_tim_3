using AutoMapper;
using ReservationService.Context;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Models.DTO.LogDtos;
using ReservationService.Models.Enums;
using ReservationService.ServiceCalls.Logger;
using ReservationService.ServiceCalls.User;

namespace ReservationService.Data
{
    public class ReservationRepository : IReservationRepository
    {
        private readonly ReservationContext _context;
        private readonly IMapper _mapper;
        private readonly IUserService _userService;
        private readonly IServiceLogger _logger;

        public ReservationRepository(ReservationContext context, IMapper mapper, IUserService userService, IServiceLogger logger)
        {
            _context = context;
            _mapper = mapper;
            _userService = userService;
            _logger = logger;
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
                dto.Member = _userService.GetUserById(reservation.userId);
                result.Add(dto);
            }

            return result;
        }

        public ReservationDto? GetReservationById(Guid id)
        {
            var reservation = _context.Reservations.FirstOrDefault(r => r.reservationId == id);
            if (reservation == null)
                return null;

            var dto = _mapper.Map<ReservationDto>(reservation);
            dto.Member = _userService.GetUserById(reservation.userId);
            return dto;
        }

        public ReservationConfirmationDto CreateReservation(ReservationCreateDto reservationDto)
        {
            var user = _userService.GetUserById(reservationDto.UserId);
            if (user == null)
            {
                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Error,
                    ServiceName = "ReservationService",
                    Action = "CreateReservation",
                    Message = $"User with ID {reservationDto.UserId} not found.",
                    EntityType = "Reservation",
                    EntityId = reservationDto.UserId
                });
                throw new KeyNotFoundException($"User with ID {reservationDto.UserId} not found.");
            }

            var newReservation = new Reservation
            {
                reservationId = Guid.NewGuid(),
                userId = reservationDto.UserId,
                sessionId = reservationDto.SessionId,
                status = ReservationStatus.Booked
            };

            _context.Reservations.Add(newReservation);
            _context.SaveChanges();

            _logger.CreateLog(new LogCreationDto
            {
                Level = LogLevels.Info,
                ServiceName = "ReservationService",
                Action = "CreateReservation",
                Message = $"Reservation created for user {user.FirstName} {user.LastName}, session {reservationDto.SessionId}.",
                EntityType = "Reservation",
                EntityId = newReservation.reservationId,
                UserId = reservationDto.UserId
            });

            return new ReservationConfirmationDto
            {
                UserName = user.FirstName + " " + user.LastName,
                SessionId = reservationDto.SessionId
            };
        }

        public ReservationConfirmationDto UpdateReservation(ReservationUpdateDto reservationDto)
        {
            var existing = _context.Reservations.FirstOrDefault(r => r.reservationId == reservationDto.ReservationId);
            var user = _userService.GetUserById(reservationDto.UserId);

            if (existing == null)
            {
                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Warning,
                    ServiceName = "ReservationService",
                    Action = "UpdateReservation",
                    Message = $"Reservation with ID {reservationDto.ReservationId} not found.",
                    EntityType = "Reservation",
                    EntityId = reservationDto.ReservationId
                });
                throw new KeyNotFoundException($"Reservation with ID {reservationDto.ReservationId} not found.");
            }

            existing.userId = reservationDto.UserId;
            existing.sessionId = reservationDto.SessionId;
            existing.status = reservationDto.Status;

            _context.SaveChanges();

            _logger.CreateLog(new LogCreationDto
            {
                Level = LogLevels.Info,
                ServiceName = "ReservationService",
                Action = "UpdateReservation",
                Message = $"Reservation {reservationDto.ReservationId} updated for user {user?.FirstName} {user?.LastName}.",
                EntityType = "Reservation",
                EntityId = reservationDto.ReservationId,
                UserId = reservationDto.UserId
            });

            return new ReservationConfirmationDto
            {
                UserName = user?.FirstName + " " + user?.LastName,
                SessionId = reservationDto.SessionId,
                Status = reservationDto.Status
            };
        }

        public void DeleteReservation(Guid id)
        {
            var reservation = _context.Reservations.FirstOrDefault(r => r.reservationId == id);
            if (reservation != null)
            {
                _context.Remove(reservation);
                _context.SaveChanges();

                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Info,
                    ServiceName = "ReservationService",
                    Action = "DeleteReservation",
                    Message = $"Reservation with ID {id} deleted.",
                    EntityType = "Reservation",
                    EntityId = id
                });
            }
            else
            {
                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Warning,
                    ServiceName = "ReservationService",
                    Action = "DeleteReservation",
                    Message = $"Attempted to delete non-existent reservation with ID {id}.",
                    EntityType = "Reservation",
                    EntityId = id
                });
            }
        }
    }
}
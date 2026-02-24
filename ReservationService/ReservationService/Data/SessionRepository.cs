using AutoMapper;
using ReservationService.Context;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Models.DTO.LogDtos;
using ReservationService.ServiceCalls.Logger;
using ReservationService.ServiceCalls.User;

namespace ReservationService.Data
{
    public class SessionRepository : ISessionRepository
    {
        private readonly ReservationContext _context;
        private readonly IMapper _mapper;
        private readonly IUserService _userService;
        private readonly IServiceLogger _logger;

        public SessionRepository(ReservationContext context, IMapper mapper, IUserService userService, IServiceLogger logger)
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

        public SessionConfirmationDto AddSession(SessionCreateDTO sessionDto)
        {
            var trainer = _userService.GetUserById(sessionDto.TrainerId);
            if (trainer == null)
            {
                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Error,
                    ServiceName = "ReservationService",
                    Action = "AddSession",
                    Message = $"Trainer with ID {sessionDto.TrainerId} not found.",
                    EntityType = "Session",
                    EntityId = sessionDto.TrainerId
                });
                throw new KeyNotFoundException($"Trainer with ID {sessionDto.TrainerId} not found.");
            }

            Session newSession;

            if (sessionDto.IsGroup)
            {
                newSession = new GroupSession
                {
                    sessionId = Guid.NewGuid(),
                    name = sessionDto.Name,
                    StartTime = sessionDto.StartTime,
                    EndTime = sessionDto.EndTime,
                    status = sessionDto.Status,
                    trainingType = sessionDto.TrainingType,
                    trainerId = sessionDto.TrainerId,
                    maxCapacity = sessionDto.MaxCapacity ?? 10,
                    hallId = sessionDto.HallId ?? 1
                };
            }
            else
            {
                newSession = new PersonalSession
                {
                    sessionId = Guid.NewGuid(),
                    name = sessionDto.Name,
                    StartTime = sessionDto.StartTime,
                    EndTime = sessionDto.EndTime,
                    status = sessionDto.Status,
                    trainingType = sessionDto.TrainingType,
                    trainerId = sessionDto.TrainerId
                };
            }

            _context.Sessions.Add(newSession);
            _context.SaveChanges();

            _logger.CreateLog(new LogCreationDto
            {
                Level = LogLevels.Info,
                ServiceName = "ReservationService",
                Action = "AddSession",
                Message = $"Session '{newSession.name}' created with ID {newSession.sessionId}.",
                EntityType = "Session",
                EntityId = newSession.sessionId
            });

            return new SessionConfirmationDto
            {
                Name = newSession.name,
                StartTime = newSession.StartTime,
                EndTime = newSession.EndTime,
                Status = newSession.status,
                TrainingType = newSession.trainingType,
                TrainerName = trainer.FirstName + " " + trainer.LastName,
                MaxCapacity = sessionDto.IsGroup ? sessionDto.MaxCapacity : null,
                HallId = sessionDto.IsGroup ? sessionDto.HallId : null
            };
        }

        public IEnumerable<SessionDto> GetAllSessions()
        {
            var sessions = _context.Sessions.ToList();
            return _mapper.Map<IEnumerable<SessionDto>>(sessions);
        }

        public IEnumerable<SessionDto> GetPersonalSessions()
        {
            var sessions = _context.Sessions.OfType<PersonalSession>().ToList();
            return _mapper.Map<IEnumerable<SessionDto>>(sessions);
        }

        public IEnumerable<SessionDto> GetGroupSessions()
        {
            var sessions = _context.Sessions.OfType<GroupSession>().ToList();
            return _mapper.Map<IEnumerable<SessionDto>>(sessions);
        }

        public SessionDto GetSessionById(Guid id)
        {
            var session = _context.Sessions.FirstOrDefault(s => s.sessionId == id);
            if (session == null) return null;
            return _mapper.Map<SessionDto>(session);
        }

        public SessionConfirmationDto UpdateSession(SessionUpdateDTO sessionDto)
        {
            var existingSession = _context.Sessions.FirstOrDefault(s => s.sessionId == sessionDto.SessionId);
            if (existingSession == null)
            {
                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Warning,
                    ServiceName = "ReservationService",
                    Action = "UpdateSession",
                    Message = $"Session with ID {sessionDto.SessionId} not found.",
                    EntityType = "Session",
                    EntityId = sessionDto.SessionId
                });
                throw new KeyNotFoundException($"Session with ID {sessionDto.SessionId} not found.");
            }

            var trainer = _userService.GetUserById(sessionDto.TrainerId);
            if (trainer == null)
            {
                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Error,
                    ServiceName = "ReservationService",
                    Action = "UpdateSession",
                    Message = $"Trainer with ID {sessionDto.TrainerId} not found.",
                    EntityType = "Session",
                    EntityId = sessionDto.TrainerId
                });
                throw new KeyNotFoundException($"Trainer with ID {sessionDto.TrainerId} not found.");
            }

            existingSession.trainingType = sessionDto.TrainingType;
            existingSession.StartTime = sessionDto.StartTime;
            existingSession.EndTime = sessionDto.EndTime;
            existingSession.status = sessionDto.Status;
            existingSession.trainerId = sessionDto.TrainerId;

            if (existingSession is GroupSession groupSession)
            {
                groupSession.maxCapacity = sessionDto.MaxCapacity ?? groupSession.maxCapacity;
                groupSession.hallId = sessionDto.HallId ?? groupSession.hallId;
            }

            _context.SaveChanges();

            _logger.CreateLog(new LogCreationDto
            {
                Level = LogLevels.Info,
                ServiceName = "ReservationService",
                Action = "UpdateSession",
                Message = $"Session '{existingSession.name}' with ID {sessionDto.SessionId} updated.",
                EntityType = "Session",
                EntityId = sessionDto.SessionId
            });

            return new SessionConfirmationDto
            {
                Name = existingSession.name,
                StartTime = existingSession.StartTime,
                EndTime = existingSession.EndTime,
                Status = existingSession.status,
                TrainingType = existingSession.trainingType,
                TrainerName = trainer.FirstName + " " + trainer.LastName,
                MaxCapacity = existingSession is GroupSession gs ? gs.maxCapacity : null,
                HallId = existingSession is GroupSession gs2 ? gs2.hallId : null
            };
        }

        public void DeleteSession(Guid id)
        {
            var session = _context.Sessions.FirstOrDefault(s => s.sessionId == id);
            if (session != null)
            {
                _context.Sessions.Remove(session);
                _context.SaveChanges();

                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Info,
                    ServiceName = "ReservationService",
                    Action = "DeleteSession",
                    Message = $"Session with ID {id} deleted.",
                    EntityType = "Session",
                    EntityId = id
                });
            }
            else
            {
                _logger.CreateLog(new LogCreationDto
                {
                    Level = LogLevels.Warning,
                    ServiceName = "ReservationService",
                    Action = "DeleteSession",
                    Message = $"Attempted to delete non-existent session with ID {id}.",
                    EntityType = "Session",
                    EntityId = id
                });
            }
        }
    }
}
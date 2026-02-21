using AutoMapper;
using ReservationService.Context;
using ReservationService.Models;
using Microsoft.EntityFrameworkCore;
using ReservationService.Models.DTO;

namespace ReservationService.Data
{
    public class SessionRepository : ISessionRepository
    {
        private readonly ReservationContext _context;
        private readonly IMapper _mapper;

        public SessionRepository(ReservationContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public bool SaveChanges()
        {
            return _context.SaveChanges() > 0;
        }
        
        public SessionDto AddSession(SessionCreateDTO sessionDto)
        {
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
                    maxCapacity = sessionDto.MaxCapacity.Value,
                    hallId = sessionDto.HallId.Value
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

            return _mapper.Map<SessionDto>(newSession);
        }

        // Vrati sve sesije
        public IEnumerable<SessionDto> GetAllSessions()
        {
            var sessions = _context.Sessions.ToList();
            return _mapper.Map<IEnumerable<SessionDto>>(sessions);
        }

        // Samo personal sesije
        // EF Core automatski kreira jednu tabelu Sessions u bazi i dodaje posebnu kolonu Discriminator. zato zna sta da vadi
        public IEnumerable<SessionDto> GetPersonalSessions()
        {
            var sessions = _context.Sessions.OfType<PersonalSession>().ToList();
            return _mapper.Map<IEnumerable<SessionDto>>(sessions);
        }

        // Samo grupne sesije
        public IEnumerable<SessionDto> GetGroupSessions()
        {
            var sessions = _context.Sessions.OfType<GroupSession>().ToList();
            return _mapper.Map<IEnumerable<SessionDto>>(sessions);
        }

        // Vrati po ID
        public SessionDto GetSessionById(Guid id)
        {
            var session = _context.Sessions.FirstOrDefault(s => s.sessionId == id);
            if (session == null) return null;

            return _mapper.Map<SessionDto>(session);
        }

        // Update sesije
        public SessionDto UpdateSession(SessionUpdateDTO sessionDto)
        {
            var existingSession = _context.Sessions.FirstOrDefault(s => s.sessionId == sessionDto.SessionId);
            if (existingSession == null) return null;

            existingSession.trainingType = sessionDto.TrainingType;
            existingSession.StartTime = sessionDto.StartTime;
            existingSession.EndTime = sessionDto.EndTime;
            existingSession.status = sessionDto.Status;
            existingSession.trainerId = sessionDto.TrainerId;

            if (existingSession is GroupSession groupSession)
            {
                groupSession.maxCapacity = sessionDto.MaxCapacity.Value;
                groupSession.hallId = sessionDto.HallId.Value;
            }


            _context.SaveChanges();

            return _mapper.Map<SessionDto>(existingSession);
        }

        // Delete sesije
        public void DeleteSession(Guid id)
        {
            var session = _context.Sessions.FirstOrDefault(s => s.sessionId == id);
            if (session != null)
            {
                _context.Sessions.Remove(session);
                _context.SaveChanges();
            }
        }
    }
}

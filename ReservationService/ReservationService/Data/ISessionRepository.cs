using ReservationService.Models;
using ReservationService.Models.DTO;
using System;
using System.Collections.Generic;

namespace ReservationService.Data
{
    public interface ISessionRepository
    {
        // Save changes
        bool SaveChanges();

        // CRUD
        SessionDto AddSession(SessionCreateDTO sessionDto);
        SessionDto GetSessionById(Guid id);
        IEnumerable<SessionDto> GetAllSessions();
        IEnumerable<SessionDto> GetPersonalSessions();
        IEnumerable<SessionDto> GetGroupSessions();
        SessionDto UpdateSession(SessionUpdateDTO sessionDto);
        void DeleteSession(Guid id);
    }
}
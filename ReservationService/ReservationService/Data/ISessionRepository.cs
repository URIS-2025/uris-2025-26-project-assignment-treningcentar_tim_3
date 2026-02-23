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
        SessionConfirmationDto AddSession(SessionCreateDTO sessionDto);
        SessionDto GetSessionById(Guid id);
        IEnumerable<SessionDto> GetAllSessions();
        IEnumerable<SessionDto> GetPersonalSessions();
        IEnumerable<SessionDto> GetGroupSessions();
        SessionConfirmationDto UpdateSession(SessionUpdateDTO sessionDto);
        void DeleteSession(Guid id);
    }
}
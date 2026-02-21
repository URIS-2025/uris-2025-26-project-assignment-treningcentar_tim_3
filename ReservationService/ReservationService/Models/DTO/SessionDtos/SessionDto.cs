using ReservationService.Models.Enums;
using System;

namespace ReservationService.Models.DTO
{
    public class SessionDto
    {
        public Guid SessionId { get; set; }
        public string Name { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public SessionStatus Status { get; set; }
        public TrainingType TrainingType { get; set; }
        public int TrainerId { get; set; }
        
        // Samo za group session
        public int? MaxCapacity { get; set; }
        public int? HallId { get; set; }

    }
}
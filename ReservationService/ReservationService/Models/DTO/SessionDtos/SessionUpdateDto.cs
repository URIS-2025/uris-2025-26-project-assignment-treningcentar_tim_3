using ReservationService.Models.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace ReservationService.Models.DTO
{
    public class SessionUpdateDTO
    {
        [Required]
        public Guid SessionId { get; set; }
        public string Name { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public SessionStatus Status { get; set; }
        public TrainingType TrainingType { get; set; }
        public Guid TrainerId { get; set; }

        // Samo za group session (mogu biti null)
        public int? MaxCapacity { get; set; }
        public Guid? TrainingHallId { get; set; }
    }
}
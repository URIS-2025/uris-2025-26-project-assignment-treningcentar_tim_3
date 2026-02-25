using ReservationService.Models.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace ReservationService.Models.DTO
{
    public class SessionCreateDTO
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public DateTime StartTime { get; set; }
        [Required]
        public DateTime EndTime { get; set; }
        [Required]
        public SessionStatus Status { get; set; }
        [Required]
        public TrainingType TrainingType { get; set; }
        [Required]
        public Guid TrainerId { get; set; }

        // Samo za group session
        public int? MaxCapacity { get; set; }
        public Guid? TrainingHallId { get; set; }

        public bool IsGroup { get; set; }
    }
}
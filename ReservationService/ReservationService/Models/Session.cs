using ReservationService.Models.Enums;

namespace ReservationService.Models;

public abstract class Session
{
    public Guid sessionId { get; set; }
    public string name { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public SessionStatus status { get; set; }
    public TrainingType trainingType { get; set; }
    public int trainerId { get; set; }
}
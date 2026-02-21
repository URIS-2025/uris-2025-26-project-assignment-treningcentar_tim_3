namespace ReservationService.Models.DTO
{
    public class TrainingHallDto
    {
        public Guid TrainingHallId { get; set; }
        public string TrainingHallName { get; set; }
        public string? Description { get; set; }
        public int Capacity { get; set; }
    }
}
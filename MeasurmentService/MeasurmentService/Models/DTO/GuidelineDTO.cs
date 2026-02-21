using MeasurmentService.Models;

namespace MeasurmentService.Models.DTO
{
    public class GuidelineDTO
    {
        public Guid GuidelineId { get; set; }
        public Guid AppointmentId { get; set; }
        public Guid CreatedByNutritionistId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public GuidelineCategory Category { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
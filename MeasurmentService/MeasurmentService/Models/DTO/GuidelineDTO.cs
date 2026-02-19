using MeasurmentService.Models;

namespace MeasurmentService.Models.DTO
{
    public class GuidelineDTO
    {

        public int GuidelineId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public GuidelineCategory Category { get; set; }
        public DateTime LastUpdated { get; set; }

    }
}

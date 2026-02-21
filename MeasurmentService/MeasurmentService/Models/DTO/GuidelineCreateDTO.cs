using MeasurmentService.Models;

namespace MeasurmentService.Models.DTO
{
    public class GuidelineCreateDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public GuidelineCategory Category { get; set; }
    }
}
using MeasurmentService.Models;
using System.ComponentModel.DataAnnotations;

namespace MeasurmentService.Models
{
    public class Guideline
    {
        [Key]
        public int GuidelineId { get; set; }

        [Required, MaxLength(120)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(2000)]
        public string Content { get; set; } = string.Empty;

        public GuidelineCategory Category { get; set; } = GuidelineCategory.Other;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;


    }
}

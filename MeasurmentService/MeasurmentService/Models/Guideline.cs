using System.ComponentModel.DataAnnotations;

namespace MeasurmentService.Models
{
    public class Guideline
    {
        [Key]
        public Guid GuidelineId { get; set; } = Guid.NewGuid();

        // Ovo je ključ veze: guideline je UVEK za neki appointment (1:1)
        [Required]
        public Guid AppointmentId { get; set; }

        // Autor guideline-a (nutritionist iz tokena)
        [Required]
        public Guid CreatedByNutritionistId { get; set; }

        [Required, MaxLength(120)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(2000)]
        public string Content { get; set; } = string.Empty;

        public GuidelineCategory Category { get; set; } = GuidelineCategory.Other;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // navigation nazad
        public MeasurementAppointment? MeasurementAppointment { get; set; }
    }
}
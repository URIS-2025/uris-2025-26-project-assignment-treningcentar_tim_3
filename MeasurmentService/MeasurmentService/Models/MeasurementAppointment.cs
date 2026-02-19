using System.ComponentModel.DataAnnotations;

namespace MeasurmentService.Models
{
    public class MeasurementAppointment
    {

        [Key]
        public int AppointmentId { get; set; }

        [Required]
        public int MemberId { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public Measurements Measurements { get; set; } = new();

        [MaxLength(2000)]
        public string? Notes { get; set; }

        public int? ServiceId { get; set; }

        public int? GuidelineId { get; set; }
        public Guideline? Guideline { get; set; }

    }
}

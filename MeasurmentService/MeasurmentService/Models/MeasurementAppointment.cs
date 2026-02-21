using System.ComponentModel.DataAnnotations;

namespace MeasurmentService.Models
{
    public class MeasurementAppointment
    {
        [Key]
        public Guid AppointmentId { get; set; } = Guid.NewGuid();

       
        [Required]
        public Guid MemberId { get; set; }          

        [Required]
        public Guid EmployeeId { get; set; }       

        [Required]
        public Guid NutritionistId { get; set; }   

        [Required]
        public DateTime Date { get; set; }

        public Measurements Measurements { get; set; } = new();

        [MaxLength(2000)]
        public string? Notes { get; set; }

        public Guid? ServiceId { get; set; }

      
        public Guideline? Guideline { get; set; }
    }
}
namespace MeasurmentService.Models.DTO
{
    public class MeasurementAppointmentCreateDTO
    {
        public Guid MemberId { get; set; }
        public Guid EmployeeId { get; set; } // trainer
        public Guid? NutritionistId { get; set; }
        public DateTime Date { get; set; }

        public string? Notes { get; set; }
        public Guid? ServiceId { get; set; }
    }
}
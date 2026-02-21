namespace MeasurmentService.Models.DTO
{
    public class MeasurementAppointmentCreateDTO
    {
        public Guid MemberId { get; set; }
        public Guid EmployeeId { get; set; } // trainer

        public DateTime Date { get; set; }

        public double? WeightKg { get; set; }
        public double? HeightCm { get; set; }
        public double? BodyFatPercent { get; set; }

        public string? Notes { get; set; }
        public Guid? ServiceId { get; set; }
    }
}
namespace MeasurmentService.Models.DTO
{
    public class MeasurementAppointmentCreateDTO
    {
        public int MemberId { get; set; }
        public int EmployeeId { get; set; }
        public DateTime Date { get; set; }

        public double? WeightKg { get; set; }
        public double? HeightCm { get; set; }
        public double? BodyFatPercent { get; set; }

        public string? Notes { get; set; }
        public int? ServiceId { get; set; }
        public int? GuidelineId { get; set; }
    }
}

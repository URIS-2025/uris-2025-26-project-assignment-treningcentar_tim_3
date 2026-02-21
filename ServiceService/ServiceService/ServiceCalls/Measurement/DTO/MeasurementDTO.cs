namespace ServiceService.ServiceCalls.Measurement.DTO
{
    public class MeasurementDTO
    {
        public Guid AppointmentId { get; set; }

        public Guid MemberId { get; set; }
        public Guid EmployeeId { get; set; }
        public Guid NutritionistId { get; set; }

        public DateTime Date { get; set; }

        public double? WeightKg { get; set; }
        public double? HeightCm { get; set; }
        public double? BodyFatPercent { get; set; }

        public string? Notes { get; set; }
        public Guid? ServiceId { get; set; }

        public Guid? GuidelineId { get; set; } // radi lakšeg prikaza (iz navigation)
    }
}

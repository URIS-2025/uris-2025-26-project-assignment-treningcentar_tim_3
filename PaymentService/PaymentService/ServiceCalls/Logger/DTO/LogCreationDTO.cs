using System.ComponentModel.DataAnnotations;

namespace PaymentService.ServiceCalls.Logger.DTO
{
    public enum LogLevels
    {
        Trace = 0, Debug = 1, Info = 2, Warning = 3, Error = 4, Critical = 5
    }

    public class LogCreationDTO
    {
        [Required] public LogLevels Level { get; set; }

        [Required, StringLength(100)] public string ServiceName { get; set; } = string.Empty;

        [Required, StringLength(200)] public string Action { get; set; } = string.Empty;

        [Required, StringLength(2000)] public string Message { get; set; } = string.Empty;

        [StringLength(10000)] public string? Details { get; set; }

        public string? CorrelationId { get; set; }
        public string? EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public Guid? UserId { get; set; }
        public DateTime? TimestampUtc { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using LoggerService.Models.Enums;

namespace LoggerService.Models.DTO
{
    public class LogCreationDTO
    {
        [Required]
        [EnumDataType(typeof(LogLevels))]
        public LogLevels Level { get; set; }

        [Required, StringLength(100, MinimumLength = 2)]
        public string ServiceName { get; set; } = string.Empty;

        [Required, StringLength(200, MinimumLength = 2)]
        public string Action { get; set; } = string.Empty;

        [Required, StringLength(2000, MinimumLength = 1)]
        public string Message { get; set; } = string.Empty;

        [StringLength(10000)]
        public string? Details { get; set; }

        [StringLength(100)]
        public string? CorrelationId { get; set; }

        [StringLength(100)]
        public string? EntityType { get; set; }

        public Guid? EntityId { get; set; }

        public Guid? UserId { get; set; }

        // Opcionalno: ako ne pošalje, server postavlja
        public DateTime? TimestampUtc { get; set; }
    }
}
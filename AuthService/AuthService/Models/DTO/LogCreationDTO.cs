using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;

namespace AuthService.Models.DTO
{
    public class LogCreationDTO
    {

        public LogLevels Level { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string? CorrelationId { get; set; }
        public string? EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public Guid? UserId { get; set; }
        public DateTime? TimestampUtc { get; set; }
    }
}

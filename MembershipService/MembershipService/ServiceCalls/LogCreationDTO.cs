using System.ComponentModel.DataAnnotations;

namespace MembershipService.ServiceCalls.Logger;

public class LogCreationDTO
{
    [Required]
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

    public DateTime? TimestampUtc { get; set; }
}

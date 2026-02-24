namespace MembershipService.ServiceCalls.Logger
{
    public interface ILoggerService
    {
        Task<bool> LogAsync(LogCreationDTO logEntry);
        Task<bool> LogInfoAsync(string action, string message, Guid? entityId = null, string? details = null);
        Task<bool> LogErrorAsync(string action, string message, Guid? entityId = null, string? details = null);
        Task<bool> LogWarningAsync(string action, string message, Guid? entityId = null, string? details = null);
    }
}

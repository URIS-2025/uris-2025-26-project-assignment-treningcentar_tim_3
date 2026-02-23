using ServiceService.ServiceCalls.Logger.DTO;

namespace ServiceService.ServiceCalls.Logger
{
    public interface ILoggerService
    {
        Task TryLogAsync(LogCreationDTO dto, CancellationToken ct = default);
    }
}

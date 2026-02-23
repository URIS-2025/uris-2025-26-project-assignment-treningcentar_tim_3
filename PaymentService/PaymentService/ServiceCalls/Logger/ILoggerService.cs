using PaymentService.ServiceCalls.Logger.DTO;

namespace PaymentService.ServiceCalls.Logger
{
    public interface ILoggerService
    {
        Task TryLogAsync(LogCreationDTO dto, CancellationToken ct = default);
    }
}

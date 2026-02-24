using AuthService.Models.DTO;

namespace AuthService.ServiceCalls.Logger
{
    public interface IServiceLogger
    {
        LogDTO CreateLog(LogCreationDTO dto);
    }
}

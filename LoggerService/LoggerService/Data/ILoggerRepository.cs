using LoggerService.Models.DTO;
using LoggerService.Models.Enums;

namespace LoggerService.Data
{
    public interface ILoggerRepository
    {
        IEnumerable<LogDTO> GetAll(int take = 100);

        LogDTO? GetById(Guid id);

        IEnumerable<LogDTO> Search(
            LogLevels? level,
            string? serviceName,
            string? action,
            Guid? entityId,
            DateTime? fromUtc,
            DateTime? toUtc,
            int take = 100);

        LogDTO Create(LogCreationDTO dto);

        void Delete(Guid id);
    }
}
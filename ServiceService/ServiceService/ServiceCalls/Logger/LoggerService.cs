using ServiceService.ServiceCalls.Logger.DTO;

namespace ServiceService.ServiceCalls.Logger
{
    public class LoggerService : ILoggerService
    {
        private readonly HttpClient _http;

        public LoggerService(HttpClient http)
        {
            _http = http;
        }

        public async Task TryLogAsync(LogCreationDTO dto, CancellationToken ct = default)
        {
            try
            {
               
                dto.TimestampUtc ??= DateTime.UtcNow;

                // Logger endpoint: POST api/logger
                using var res = await _http.PostAsJsonAsync("api/logger", dto, ct);

            }
            catch
            {
                // swallow — logger je opcioni
            }
        }
    }
}

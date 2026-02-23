using System.Net.Http.Json;
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

                using var res = await _http.PostAsJsonAsync("api/logger", dto, ct);

             
            }
            catch (Exception ex)
            {
                Console.WriteLine($"LOGGER EXCEPTION -> {ex.Message}");
            }
        }
    }
}
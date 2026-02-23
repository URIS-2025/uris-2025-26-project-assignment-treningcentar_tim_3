using Newtonsoft.Json;

namespace MembershipService.ServiceCalls.Logger
{
    public class LoggerService : ILoggerService
    {
        private readonly IConfiguration _configuration;

        public LoggerService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> LogAsync(LogCreationDTO logEntry)
        {
            using (HttpClient client = new HttpClient())
            {
                try
                {
                    Uri url = new Uri($"{_configuration["Services:LoggerService"]}api/logger");
                    
                    var json = JsonConvert.SerializeObject(logEntry);
                    var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                    
                    var response = await client.PostAsync(url, content);
                    return response.IsSuccessStatusCode;
                }
                catch (Exception)
                {
                    // Log locally or fail silently - don't block main operation on logger service failure
                    return false;
                }
            }
        }

        public async Task<bool> LogInfoAsync(string action, string message, Guid? entityId = null, string? details = null)
        {
            var logEntry = new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "MembershipService",
                Action = action,
                Message = message,
                Details = details,
                EntityId = entityId,
                TimestampUtc = DateTime.UtcNow
            };

            return await LogAsync(logEntry);
        }

        public async Task<bool> LogErrorAsync(string action, string message, Guid? entityId = null, string? details = null)
        {
            var logEntry = new LogCreationDTO
            {
                Level = LogLevels.Error,
                ServiceName = "MembershipService",
                Action = action,
                Message = message,
                Details = details,
                EntityId = entityId,
                TimestampUtc = DateTime.UtcNow
            };

            return await LogAsync(logEntry);
        }

        public async Task<bool> LogWarningAsync(string action, string message, Guid? entityId = null, string? details = null)
        {
            var logEntry = new LogCreationDTO
            {
                Level = LogLevels.Warning,
                ServiceName = "MembershipService",
                Action = action,
                Message = message,
                Details = details,
                EntityId = entityId,
                TimestampUtc = DateTime.UtcNow
            };

            return await LogAsync(logEntry);
        }
    }
}

using ReservationService.Models.DTO.LogDtos;
using ReservationService.Models.DTO.MemberDtos;

namespace ReservationService.ServiceCalls.Logger;

using Newtonsoft.Json;

public class ServiceLogger : IServiceLogger
{
    private readonly IConfiguration _configuration;

    public ServiceLogger(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public LogDto CreateLog(LogCreationDto dto)
    {
        using (HttpClient client = new HttpClient())
        {
            var loggerUrl = _configuration["Services:LoggerService"]?.Replace("localhost:5194", "logger-service:8080");
            Uri url = new Uri($"{loggerUrl}/api/logger");

            var json = JsonConvert.SerializeObject(dto);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = client.PostAsync(url, content).Result;
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var responseContent = response.Content.ReadAsStringAsync().Result;
            return JsonConvert.DeserializeObject<LogDto>(responseContent);
        }
    }
}
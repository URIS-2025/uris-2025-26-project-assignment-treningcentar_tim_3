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
        try
        {
            using (HttpClient client = new HttpClient())
            {
                var loggerUrl = _configuration["Services:LoggerService"] ?? "http://localhost:5194/";
                Uri url = new Uri($"{loggerUrl.TrimEnd('/')}/api/logger");

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
        catch (Exception)
        {
            // Silently fail logging to avoid breaking core functionality
            return null;
        }
    }
}
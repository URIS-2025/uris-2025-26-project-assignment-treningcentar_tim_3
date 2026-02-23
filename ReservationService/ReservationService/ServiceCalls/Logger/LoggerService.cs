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
            Uri url = new Uri($"{_configuration["Services:LoggerService"]}api/logger");

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
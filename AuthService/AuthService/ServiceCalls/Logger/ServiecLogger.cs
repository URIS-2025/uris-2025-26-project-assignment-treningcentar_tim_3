namespace AuthService.ServiceCalls.Logger
{
    using AuthService.Models.DTO;
    using Newtonsoft.Json;

    public class ServiceLogger : IServiceLogger
    {
        private readonly IConfiguration _configuration;

        public ServiceLogger(IConfiguration configuration)
        {
            _configuration = configuration;

        }

        public LogDTO CreateLog(LogCreationDTO dto)
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
                return JsonConvert.DeserializeObject<LogDTO>(responseContent);


            }
        }

        public async Task<LogDTO?> CreateLogAsync(LogCreationDTO dto)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(5);
                    Uri url = new Uri($"{_configuration["Services:LoggerService"]}api/logger");
                    var json = JsonConvert.SerializeObject(dto);
                    var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(url, content);
                    return response.IsSuccessStatusCode
                        ? JsonConvert.DeserializeObject<LogDTO>(await response.Content.ReadAsStringAsync())
                        : null;
                }
            }
            catch { return null; } // handle logger service failure
        }
    }
}

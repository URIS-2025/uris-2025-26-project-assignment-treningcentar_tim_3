using Newtonsoft.Json;
using PaymentService.Models.DTO.Service;

namespace PaymentService.ServiceCalls.ServiceService
{
    public class ServiceService : IServiceService
    {
        private readonly IConfiguration _configuration;

        public ServiceService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public ServiceDTO GetServiceById(Guid id)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri url = new Uri($"{_configuration["Services:ServiceService"]}api/service/{id}");

                var response = client.GetAsync(url).Result;
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = response.Content.ReadAsStringAsync().Result;
                return JsonConvert.DeserializeObject<ServiceDTO>(content);
            }
        }
    }
}

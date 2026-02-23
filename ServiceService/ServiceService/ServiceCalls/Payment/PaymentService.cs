using Newtonsoft.Json;
using ServiceService.ServiceCalls.Payment.DTO;

namespace ServiceService.ServiceCalls.Payment
{
    public class PaymentService : IPaymentService
    {
        private readonly IConfiguration configuration;

        public PaymentService(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public PaymentDTO GetPaymentById(Guid id)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri url = new Uri($"{configuration["Services:PaymentService"]}api/payment/{id}");

                var response = client.GetAsync(url).Result;
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = response.Content.ReadAsStringAsync().Result;
                return JsonConvert.DeserializeObject<PaymentDTO>(content);
            }
        }
    }
}
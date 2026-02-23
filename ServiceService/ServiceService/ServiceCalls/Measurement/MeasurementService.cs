using Newtonsoft.Json;
using ServiceService.ServiceCalls.Measurement.DTO;

namespace ServiceService.ServiceCalls.Measurement
{
    public class MeasurementService : IMeasurementService
    {
        private readonly IConfiguration configuration;

        public MeasurementService(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public MeasurementDTO GetMeasurementAppointmentById(Guid id)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri url = new Uri($"{configuration["Services:MeasurementService"]}api/measurementappointment/{id}");

                var response = client.GetAsync(url).Result;
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = response.Content.ReadAsStringAsync().Result;
                return JsonConvert.DeserializeObject<MeasurementDTO>(content);
            }
        }
    }
}
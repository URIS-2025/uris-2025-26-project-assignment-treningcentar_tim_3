using Newtonsoft.Json;
using ServiceService.ServiceCalls.Reservation.DTO;

namespace ServiceService.ServiceCalls.Reservation
{
    public class ReservationService : IReservationService
    {
        private readonly IConfiguration configuration;

        public ReservationService(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public ReservationDTO GetReservationById(Guid id)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri url = new Uri($"{configuration["Services:ReservationService"]}api/reservation/{id}");

                var response = client.GetAsync(url).Result;
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = response.Content.ReadAsStringAsync().Result;
                return JsonConvert.DeserializeObject<ReservationDTO>(content);
            }
        }
    }
}
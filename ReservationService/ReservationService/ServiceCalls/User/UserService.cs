using ReservationService.Models.DTO.MemberDtos;

namespace ReservationService.ServiceCalls.User;
using Newtonsoft.Json;

public class UserService : IUserService
{
    
    private readonly IConfiguration _configuration;
    
    public UserService(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    public MemberDto GetUserById(Guid id)
    {
        using (HttpClient client = new HttpClient())
        {
            // Inside the Docker network, use the internal docker hostname and port instead of localhost externally
            var authServiceUrl = _configuration["Services:AuthService"]?.Replace("localhost:5120", "auth-service:8080");
            Uri url = new Uri($"{authServiceUrl}/api/auth/{id}");

            var response = client.GetAsync(url).Result;
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }
            var content = response.Content.ReadAsStringAsync().Result;
            return JsonConvert.DeserializeObject<MemberDto>(content);
        }
    }
}
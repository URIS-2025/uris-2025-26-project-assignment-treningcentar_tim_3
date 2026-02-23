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
            var x = _configuration["Services:AuthService"];
            Uri url = new Uri($"{_configuration["Services:AuthService"]}api/student/{id}");

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
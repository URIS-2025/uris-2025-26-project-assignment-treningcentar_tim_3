using ReservationService.Models.DTO.MemberDtos;
using System.Net.Http;

namespace ReservationService.ServiceCalls.User;
using Newtonsoft.Json;

public class UserService : IUserService
{
    
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    
    public UserService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }
    
    public MemberDto GetUserById(Guid id)
    {
        try
        {
            var authServiceUrl = _configuration["Services:AuthService"] ?? "http://localhost:5120";
            
            var client = _httpClientFactory.CreateClient();
            Uri url = new Uri($"{authServiceUrl}/api/auth/{id}");

            var response = client.GetAsync(url).Result;
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = response.Content.ReadAsStringAsync().Result;
                throw new Exception($"AuthService returned {response.StatusCode}: {errorContent}. URL: {url}");
            }
            var content = response.Content.ReadAsStringAsync().Result;
            return JsonConvert.DeserializeObject<MemberDto>(content);
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to get user {id} from AuthService: {ex.Message}", ex);
        }
    }
}

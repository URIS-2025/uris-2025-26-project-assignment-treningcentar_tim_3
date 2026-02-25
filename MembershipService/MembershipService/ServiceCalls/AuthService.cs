using Newtonsoft.Json;
using MembershipService.Models.DTO;

namespace MembershipService.ServiceCalls.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public UserInfoDto? GetUserById(Guid userId)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri url = new Uri($"{_configuration["Services:AuthService"]}api/auth/{userId}");

                try
                {
                    var response = client.GetAsync(url).Result;
                    if (!response.IsSuccessStatusCode)
                    {
                        return null;
                    }
                    var content = response.Content.ReadAsStringAsync().Result;
                    return JsonConvert.DeserializeObject<UserInfoDto>(content);
                }
                catch (Exception)
                {
                    // Log error if needed
                    return null;
                }
            }
        }

        public bool UserExists(Guid userId)
        {
            var user = GetUserById(userId);
            return user != null;
        }

        public bool IsUserAdmin(Guid userId)
        {
            var user = GetUserById(userId);
            // Adjust role check based on your AuthService role structure
            return user?.Role == "Admin";
        }
    }
}

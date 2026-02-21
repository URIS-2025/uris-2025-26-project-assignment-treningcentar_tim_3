using Newtonsoft.Json;
using ServiceService.ServiceCalls.Membership.DTO;

namespace ServiceService.ServiceCalls.Membership
{
    public class MembershipService : IMembershipService
    {
        private readonly IConfiguration configuration;

        public MembershipService(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        public MembershipDTO GetMembershipById(Guid id)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri url = new Uri($"{configuration["Services:MembershipService"]}api/membership/{id}");

                var response = client.GetAsync(url).Result;
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = response.Content.ReadAsStringAsync().Result;
                return JsonConvert.DeserializeObject<MembershipDTO>(content);
            }
        }

        public MembershipDTO GetActiveMembershipForUser(Guid userId)
        {
            using (HttpClient client = new HttpClient())
            {
                Uri url = new Uri($"{configuration["Services:MembershipService"]}api/membership/active/{userId}");

                var response = client.GetAsync(url).Result;
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = response.Content.ReadAsStringAsync().Result;
                return JsonConvert.DeserializeObject<MembershipDTO>(content);
            }
        }
    }
}
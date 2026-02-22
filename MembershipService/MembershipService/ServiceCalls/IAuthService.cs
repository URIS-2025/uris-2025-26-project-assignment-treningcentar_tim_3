using MembershipService.Models.DTO;

namespace MembershipService.ServiceCalls.Auth
{
    public interface IAuthService
    {
        UserInfoDto? GetUserById(Guid userId);
        bool UserExists(Guid userId);
        bool IsUserAdmin(Guid userId);
    }
}

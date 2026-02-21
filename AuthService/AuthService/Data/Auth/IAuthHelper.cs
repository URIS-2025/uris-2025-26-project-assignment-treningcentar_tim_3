using AuthService.Models.DTO;

namespace AuthService.Data.Auth
{
    public interface IAuthHelper
    {
        Task<bool> AuthenticatePrincipal(string username, string password);
        string GenerateJwt(Principal principal);
    }
}

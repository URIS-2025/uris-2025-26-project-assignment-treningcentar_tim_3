 
using AuthService.Models.DTO;
using AuthService.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace AuthService.Data.Auth
{
    public class AuthHelper : IAuthHelper
    {
        private readonly IConfiguration _configuration;
        private readonly IUserRepository _userRepository;

        public AuthHelper(IConfiguration configuration, IUserRepository userRepository)
        {
            _configuration = configuration;
            _userRepository = userRepository;
        }

        public async Task<bool> AuthenticatePrincipal(string username, string password)
        {
            // Ovde proveravamo kredencijale korisnika
            return await _userRepository.UserWithCredentialsExists(username, password);
        }


        public string GenerateJwt(Principal principal)
        {
            var keyBytes = Convert.FromBase64String(_configuration["Jwt:Key"]);
            var securityKey = new SymmetricSecurityKey(keyBytes);
            // var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Issuer"],
                null, // claimovi, možeš dodati role itd.
                expires: DateTime.Now.AddMinutes(120),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}


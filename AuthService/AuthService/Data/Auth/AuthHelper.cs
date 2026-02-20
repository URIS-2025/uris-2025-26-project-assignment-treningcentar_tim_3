 
using AuthService.Models.DTO;
using AuthService.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
//using Microsoft.IdentityModel.JsonWebTokens;

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
            var keyBytes = Convert.FromBase64String(_configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key missing"));
            var securityKey = new SymmetricSecurityKey(keyBytes);
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {

                new Claim(JwtRegisteredClaimNames.Sub, principal.Id.ToString()),    // Id korisnika
        new Claim(JwtRegisteredClaimNames.UniqueName, principal.Username),  // Username
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // Jedinstveni ID tokena
        new Claim(JwtRegisteredClaimNames.Iss, _configuration["Jwt:Issuer"]),
        new Claim(JwtRegisteredClaimNames.Aud, _configuration["Jwt:Issuer"]) 
   
               /* new Claim(ClaimTypes.Name, principal.Username),
                new Claim("userId", principal.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Aud, _configuration["Jwt:Issuer"]),
                new Claim(JwtRegisteredClaimNames.Iss, _configuration["Jwt:Issuer"])*/
             };

            foreach (var role in principal.Roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role.ToString()));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience:  _configuration["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(120),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}


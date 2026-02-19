using AuthService.Data.Auth;
using AuthService.Helpers;
using AuthService.Models;
using AuthService.Models.DTO;
using AuthService.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration.UserSecrets;


namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserRepository _repository;

        public AuthController(UserRepository repository)
        {
            _repository = repository;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDTO dto)
        {
            var existingUser = await _repository.GetByUsernameAsync(dto.Username);

            if (existingUser != null)
                return BadRequest("User already exists");

            var user = new UserEntity
            {

                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = PasswordHelper.HashPassword(dto.Password),
                Role = Models.Role.User,
                FirstName = dto.FirstName,
                LastName = dto.LastName
            };

            await _repository.AddUserAsync(user);

            return Ok("User created");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto, [FromServices] IAuthHelper authHelper)
        {
           

            var user = await _repository.GetByUsernameAsync(dto.Username);

            if (user == null || !await authHelper.AuthenticatePrincipal(dto.Username, dto.Password))
                return Unauthorized("Invalid credentials");

            var principal = new Principal(user.Id, user.Username, user.Email, new List<Role> { user.Role});

            //  var token = authHelper.GenerateJwt(new Principal(user.Id, user.Username, user.Email, new List<Role> { user.Role }));
            var token = authHelper.GenerateJwt(principal);
            return Ok(new { Token = token });
        }
    }

}

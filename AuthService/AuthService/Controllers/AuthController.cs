using AuthService.Data.Auth;
using AuthService.Helpers;
using AuthService.Models;
using AuthService.Models.DTO;
using AuthService.Repositories;
using Microsoft.AspNetCore.Authorization;
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
                Role = Models.Role.Member, //member
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

  
            var token = authHelper.GenerateJwt(principal);
            return Ok(new { 
                User = user.FirstName + " " + user.LastName, 
                Role = user.Role.ToString(),
                Token = token 
            });
        }

        [HttpPut("update-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserRole(UpdateUserRolesDTO dto)
        {
            var user = await _repository.GetByUsernameAsync(dto.Username);

            if (user == null)
                return NotFound("User not found");

            user.Role = dto.NewRole;
            await _repository.UpdateUserAsync(user);

            return Ok($"Role of {user.Username} updated to {dto.NewRole}");
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _repository.GetAllUsersAsync();
            var dtoList = users.Select(u => new
            {
                Id = u.Id.ToString(),
                u.Username,
                u.Email,
                u.FirstName,
                u.LastName,
                Role = u.Role.ToString()
            });

            return Ok(dtoList);
        }

        [HttpPut("users/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDTO dto)
        {
            var users = await _repository.GetAllUsersAsync();
            var user = users.FirstOrDefault(u => u.Id.ToString() == id);

            if (user == null)
                return NotFound("User not found");

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.Email = dto.Email;
            user.Username = dto.Username;

            await _repository.UpdateUserAsync(user);

            return Ok("User updated successfully");
        }

        [HttpDelete("users/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            if (!Guid.TryParse(id, out Guid guid))
                return BadRequest("Invalid ID format");

            var users = await _repository.GetAllUsersAsync();
            var user = users.FirstOrDefault(u => u.Id == guid);

            if (user == null)
                return NotFound("User not found");

            await _repository.DeleteUserAsync(guid);
            return Ok("User deleted successfully");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            var user = await _repository.GetUserByIdAsync(id);
            if (user == null)
                return NotFound("User not found");

            return Ok(new
            {
                user.Id,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Role
            });
        }
    }

}

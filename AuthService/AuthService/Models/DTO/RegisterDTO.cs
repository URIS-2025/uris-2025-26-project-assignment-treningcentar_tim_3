using AuthService.Models;

namespace AuthService.Models.DTO
{
    public class RegisterDTO
    {

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Username { get; set; }

        public string Email { get; set; }

        public string Password { get; set; }

        public Role? Role { get; set; }
    }

}


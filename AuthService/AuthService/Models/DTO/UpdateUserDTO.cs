namespace AuthService.Models.DTO
{
    public class UpdateUserDTO
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
    }
}

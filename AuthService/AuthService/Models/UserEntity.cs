namespace AuthService.Models
{
    //Model korisnika
    public class UserEntity
    {
        public Guid Id { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; }

        public string Password { get; set; } // Hash-ovana šifra korisnika
        public List<Role> Roles { get; set; } = new();

        // public string Salt { get; set; }


    }
}

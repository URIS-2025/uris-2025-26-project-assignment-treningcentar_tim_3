namespace AuthService.Models
{
    //Model korisnika
    public class UserEntity
    {
        public Guid Id { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Username { get; set; }

        public string Email { get; set; }

        public string PasswordHash { get; set; } // Hash-ovana šifra korisnika
        //public List<Role> Roles { get; set; } = new();
        public Role Role { get; set; } = Role.User; //jer EF Core ne može automatski da mapira List<enum> direktno u PostgreSQL tabelu

      


    }
}

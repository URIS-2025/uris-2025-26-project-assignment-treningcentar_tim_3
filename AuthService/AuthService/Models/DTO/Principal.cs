namespace AuthService.Models.DTO
{
    public class Principal
    {
        // DTO koji predstavlja informacije o korisniku koje se šalju klijentu nakon uspešne autentifikacije
            public Guid Id { get; set; }         
            public string Username { get; set; } 
            public string Email { get; set; }    
            public List<Role> Roles { get; set; } // Role korisnika

            public Principal() { }

            public Principal(Guid id, string username, string email, List<Role> roles)
            {
                Id = id;
                Username = username;
                Email = email;
                Roles = roles;
            }
        }
    }



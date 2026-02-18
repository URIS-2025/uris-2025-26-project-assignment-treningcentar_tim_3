namespace AuthService.Models.DTO
{
    public class Principal
    {
       
            public int Id { get; set; }         
            public string Username { get; set; } 
            public string Email { get; set; }    
            public List<string> Roles { get; set; } // Role korisnika

            public Principal() { }

            public Principal(int id, string username, string email, List<string> roles)
            {
                Id = id;
                Username = username;
                Email = email;
                Roles = roles;
            }
        }
    }



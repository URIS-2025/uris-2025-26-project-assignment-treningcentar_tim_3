namespace AuthService.Models.DTO
{
    public class UpdateUserRolesDTO
    {
        public string Username { get; set; }  // korisnik kome menjamo rolu
        public Role NewRole { get; set; }     // nova rola
    }
}

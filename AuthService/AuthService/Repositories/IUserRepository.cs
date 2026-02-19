using AuthService.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuthService.Repositories
{
    public interface IUserRepository
    {
        // Dohvata korisnika po username
        Task<UserEntity?> GetByUsernameAsync(string username);

        // Dodaje novog korisnika u bazu
        Task AddUserAsync(UserEntity user);

        // Proverava da li postoje kredencijali (username + password)
        Task<bool> UserWithCredentialsExists(string username, string password);

        // Dohvata sve korisnike (opciono, može za admin funkcionalnost)
        Task<List<UserEntity>> GetAllUsersAsync();
    }
}


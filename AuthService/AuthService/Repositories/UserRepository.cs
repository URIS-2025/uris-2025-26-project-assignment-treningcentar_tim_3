using AuthService.Data;
using AuthService.Helpers;
using AuthService.Models;
using AuthService.Models.DTO;
using AuthService.ServiceCalls.Logger;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Repositories
{
   

    public class UserRepository : IUserRepository
    {
        private readonly AuthDbContext _context;
        private readonly IServiceLogger _logger;

        public UserRepository(AuthDbContext context, IServiceLogger logger)
        {
            _context = context;
            _logger = logger;
        }

            public async Task<UserEntity?> GetByUsernameAsync(string username)
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == username);

                await Task.Run(() => _logger.CreateLog(
                    new LogCreationDTO
                    {
                        Level = user != null ? LogLevels.Info : LogLevels.Warning,
                        ServiceName = "AuthService",
                        Action = "GetByUsername",
                        Message = user != null
                            ? $"User {username} found"
                            : $"User {username} not found",
                        EntityType = "User",
                        EntityId = user?.Id
                    }
                ));

                return user;
            }

            public async Task AddUserAsync(UserEntity user)
            {
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.CreateLog(
                    new LogCreationDTO
                    {
                        Level = LogLevels.Info,
                        ServiceName = "AuthService",
                        Action = "AddUser",
                        Message = $"User {user.Username} added successfully.",
                        EntityType = "User",
                        EntityId = user.Id,
                        UserId = user.Id
                    }
                );
            }

            public async Task<bool> UserWithCredentialsExists(string username, string password)
            {
                var user = await GetByUsernameAsync(username);
                if (user == null)
                {
                    _logger.CreateLog(
                        new LogCreationDTO
                        {
                            Level = LogLevels.Warning,
                            ServiceName = "AuthService",
                            Action = "UserWithCredentialsExists",
                            Message = $"User {username} not found.",
                            EntityType = "User"
                        }
                    );
                    return false;
                }

                // Provera lozinke sa hashom
                var isPasswordValid = PasswordHelper.VerifyPassword(password, user.PasswordHash);

                _logger.CreateLog(
                    new LogCreationDTO
                    {
                        Level = isPasswordValid ? LogLevels.Info : LogLevels.Warning,
                        ServiceName = "AuthService",
                        Action = "UserWithCredentialsExists",
                        Message = isPasswordValid
                            ? $"User {username} authenticated successfully."
                            : $"Authentication failed for user {username}.",
                        EntityType = "User",
                        EntityId = user.Id,
                        UserId = user.Id
                    }
                );

                return isPasswordValid;
            }

            public async Task<List<UserEntity>> GetAllUsersAsync()
            {
                var users = await _context.Users.ToListAsync();

                _logger.CreateLog(
                    new LogCreationDTO
                    {
                        Level = LogLevels.Info,
                        ServiceName = "AuthService",
                        Action = "GetAllUsers",
                        Message = $"Retrieved {users.Count} users.",
                        EntityType = "User"
                    }
                );

                return users;
            }

            public async Task UpdateUserAsync(UserEntity user)
            {
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                _logger.CreateLog(
                    new LogCreationDTO
                    {
                        Level = LogLevels.Info,
                        ServiceName = "AuthService",
                        Action = "UpdateUser",
                        Message = $"User {user.Username} updated successfully.",
                        EntityType = "User",
                        EntityId = user.Id,
                        UserId = user.Id
                    }
                );
            }

            public async Task DeleteUserAsync(Guid id)
            {
                var user = await _context.Users.FindAsync(id);
                if (user != null)
                {
                    _context.Users.Remove(user);
                    await _context.SaveChangesAsync();

                    _logger.CreateLog(
                        new LogCreationDTO
                        {
                            Level = LogLevels.Info,
                            ServiceName = "AuthService",
                            Action = "DeleteUser",
                            Message = $"User {user.Username} deleted successfully.",
                            EntityType = "User",
                            EntityId = user.Id
                        }
                    );
                }
            }
    }
}


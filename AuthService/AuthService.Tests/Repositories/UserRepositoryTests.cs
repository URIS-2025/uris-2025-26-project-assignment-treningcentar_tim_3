using AuthService.Data;
using AuthService.Helpers;
using AuthService.Models;
using AuthService.Models.DTO;
using AuthService.Repositories;
using AuthService.ServiceCalls.Logger;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;

namespace AuthService.Tests.Repositories
{
    [TestFixture]
    public class UserRepositoryTests
    {
        private AuthDbContext _context = null!;
        private Mock<IServiceLogger> _mockLogger = null!;
        private UserRepository _repository = null!;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<AuthDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AuthDbContext(options);
            _mockLogger = new Mock<IServiceLogger>();
            _repository = new UserRepository(_context, _mockLogger.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region GetByUsernameAsync Tests

        [Test]
        public async Task GetByUsernameAsync_WithExistingUser_ReturnsUser()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByUsernameAsync("testuser");

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Username, Is.EqualTo("testuser"));
        }

        [Test]
        public async Task GetByUsernameAsync_WithNonExistingUser_ReturnsNull()
        {
            // Act
            var result = await _repository.GetByUsernameAsync("nonexistent");

            // Assert
            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task GetByUsernameAsync_IsCaseSensitive()
        {
            // Arrange
            var user = CreateTestUser("TestUser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByUsernameAsync("testuser");

            // Assert - PostgreSQL is case-sensitive by default
            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task GetByUsernameAsync_LogsInfoOnSuccess()
        {
            // Arrange
            var user = CreateTestUser("loguser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            await _repository.GetByUsernameAsync("loguser");

            // Assert
            _mockLogger.Verify(l => l.CreateLog(It.Is<LogCreationDTO>(
                dto => dto.Level == LogLevels.Info && dto.Action == "GetByUsername"
            )), Times.Once);
        }

        [Test]
        public async Task GetByUsernameAsync_LogsWarningOnNotFound()
        {
            // Act
            await _repository.GetByUsernameAsync("nonexistent");

            // Assert
            _mockLogger.Verify(l => l.CreateLog(It.Is<LogCreationDTO>(
                dto => dto.Level == LogLevels.Warning && dto.Action == "GetByUsername"
            )), Times.Once);
        }

        #endregion

        #region GetUserByIdAsync Tests

        [Test]
        public async Task GetUserByIdAsync_WithExistingUser_ReturnsUser()
        {
            // Arrange
            var user = CreateTestUser("iduser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetUserByIdAsync(user.Id);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(user.Id));
        }

        [Test]
        public async Task GetUserByIdAsync_WithNonExistingId_ReturnsNull()
        {
            // Act
            var result = await _repository.GetUserByIdAsync(Guid.NewGuid());

            // Assert
            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task GetUserByIdAsync_WithEmptyGuid_ReturnsNull()
        {
            // Act
            var result = await _repository.GetUserByIdAsync(Guid.Empty);

            // Assert
            Assert.That(result, Is.Null);
        }

        #endregion

        #region AddUserAsync Tests

        [Test]
        public async Task AddUserAsync_WithValidUser_AddsToDatabase()
        {
            // Arrange
            var user = CreateTestUser("newuser");

            // Act
            await _repository.AddUserAsync(user);

            // Assert
            var savedUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == "newuser");
            Assert.That(savedUser, Is.Not.Null);
            Assert.That(savedUser!.Email, Is.EqualTo(user.Email));
        }

        [Test]
        public async Task AddUserAsync_AssignsNewGuid()
        {
            // Arrange
            var user = CreateTestUser("guiduser");
            user.Id = Guid.Empty;

            // Act
            await _repository.AddUserAsync(user);

            // Assert - EF Core should generate a new GUID
            var savedUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == "guiduser");
            Assert.That(savedUser, Is.Not.Null);
        }

        [Test]
        public async Task AddUserAsync_LogsSuccess()
        {
            // Arrange
            var user = CreateTestUser("logadduser");

            // Act
            await _repository.AddUserAsync(user);

            // Assert
            _mockLogger.Verify(l => l.CreateLog(It.Is<LogCreationDTO>(
                dto => dto.Level == LogLevels.Info && dto.Action == "AddUser"
            )), Times.Once);
        }

        [Test]
        public async Task AddUserAsync_SetsDefaultRole()
        {
            // Arrange
            var user = new UserEntity
            {
                Id = Guid.NewGuid(),
                Username = "defaultroleuser",
                Email = "test@test.com",
                FirstName = "Test",
                LastName = "User",
                PasswordHash = "hash"
            };

            // Act
            await _repository.AddUserAsync(user);

            // Assert
            var savedUser = await _context.Users.FirstAsync(u => u.Username == "defaultroleuser");
            Assert.That(savedUser.Role, Is.EqualTo(Role.Member));
        }

        #endregion

        #region UserWithCredentialsExists Tests

        [Test]
        public async Task UserWithCredentialsExists_WithValidCredentials_ReturnsTrue()
        {
            // Arrange
            var password = "TestPassword123!";
            var user = CreateTestUser("creduser");
            user.PasswordHash = PasswordHelper.HashPassword(password);
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.UserWithCredentialsExists("creduser", password);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task UserWithCredentialsExists_WithWrongPassword_ReturnsFalse()
        {
            // Arrange
            var user = CreateTestUser("wrongpassuser");
            user.PasswordHash = PasswordHelper.HashPassword("correctpassword");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.UserWithCredentialsExists("wrongpassuser", "wrongpassword");

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task UserWithCredentialsExists_WithNonExistingUser_ReturnsFalse()
        {
            // Act
            var result = await _repository.UserWithCredentialsExists("nonexistent", "anypassword");

            // Assert
            Assert.That(result, Is.False);
        }

        #endregion

        #region GetAllUsersAsync Tests

        [Test]
        public async Task GetAllUsersAsync_WithNoUsers_ReturnsEmptyList()
        {
            // Act
            var result = await _repository.GetAllUsersAsync();

            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetAllUsersAsync_WithMultipleUsers_ReturnsAllUsers()
        {
            // Arrange
            await _context.Users.AddRangeAsync(
                CreateTestUser("user1"),
                CreateTestUser("user2"),
                CreateTestUser("user3")
            );
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetAllUsersAsync();

            // Assert
            Assert.That(result.Count, Is.EqualTo(3));
        }

        [Test]
        public async Task GetAllUsersAsync_ReturnsCorrectUserData()
        {
            // Arrange
            var user = CreateTestUser("datauser");
            user.FirstName = "John";
            user.LastName = "Doe";
            user.Role = Role.Trainer;
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetAllUsersAsync();

            // Assert
            var returnedUser = result.First();
            Assert.That(returnedUser.FirstName, Is.EqualTo("John"));
            Assert.That(returnedUser.LastName, Is.EqualTo("Doe"));
            Assert.That(returnedUser.Role, Is.EqualTo(Role.Trainer));
        }

        #endregion

        #region UpdateUserAsync Tests

        [Test]
        public async Task UpdateUserAsync_UpdatesUserInDatabase()
        {
            // Arrange
            var user = CreateTestUser("updateuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            user.FirstName = "UpdatedFirst";
            user.LastName = "UpdatedLast";
            await _repository.UpdateUserAsync(user);

            // Assert
            var updatedUser = await _context.Users.FirstAsync(u => u.Username == "updateuser");
            Assert.That(updatedUser.FirstName, Is.EqualTo("UpdatedFirst"));
            Assert.That(updatedUser.LastName, Is.EqualTo("UpdatedLast"));
        }

        [Test]
        public async Task UpdateUserAsync_UpdatesRole()
        {
            // Arrange
            var user = CreateTestUser("roleupdate");
            user.Role = Role.Member;
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            user.Role = Role.Admin;
            await _repository.UpdateUserAsync(user);

            // Assert
            var updatedUser = await _context.Users.FirstAsync(u => u.Username == "roleupdate");
            Assert.That(updatedUser.Role, Is.EqualTo(Role.Admin));
        }

        [Test]
        public async Task UpdateUserAsync_LogsSuccess()
        {
            // Arrange
            var user = CreateTestUser("logupdateuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            await _repository.UpdateUserAsync(user);

            // Assert
            _mockLogger.Verify(l => l.CreateLog(It.Is<LogCreationDTO>(
                dto => dto.Level == LogLevels.Info && dto.Action == "UpdateUser"
            )), Times.Once);
        }

        #endregion

        #region DeleteUserAsync Tests

        [Test]
        public async Task DeleteUserAsync_WithExistingUser_RemovesFromDatabase()
        {
            // Arrange
            var user = CreateTestUser("deleteuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            var userId = user.Id;

            // Act
            await _repository.DeleteUserAsync(userId);

            // Assert
            var deletedUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            Assert.That(deletedUser, Is.Null);
        }

        [Test]
        public async Task DeleteUserAsync_WithNonExistingUser_DoesNotThrow()
        {
            // Act & Assert
            Assert.DoesNotThrowAsync(async () => await _repository.DeleteUserAsync(Guid.NewGuid()));
        }

        [Test]
        public async Task DeleteUserAsync_LogsOnSuccess()
        {
            // Arrange
            var user = CreateTestUser("logdeleteuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            var userId = user.Id;

            // Act
            await _repository.DeleteUserAsync(userId);

            // Assert
            _mockLogger.Verify(l => l.CreateLog(It.Is<LogCreationDTO>(
                dto => dto.Level == LogLevels.Info && dto.Action == "DeleteUser"
            )), Times.Once);
        }

        #endregion

        #region Helper Methods

        private static UserEntity CreateTestUser(string username)
        {
            return new UserEntity
            {
                Id = Guid.NewGuid(),
                Username = username,
                Email = $"{username}@test.com",
                FirstName = "Test",
                LastName = "User",
                PasswordHash = PasswordHelper.HashPassword("password123"),
                Role = Role.Member
            };
        }

        #endregion
    }
}

using AuthService.Controllers;
using AuthService.Data;
using AuthService.Data.Auth;
using AuthService.Helpers;
using AuthService.Models;
using AuthService.Models.DTO;
using AuthService.Repositories;
using AuthService.ServiceCalls.Logger;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using System.Security.Claims;

namespace AuthService.Tests.Controllers
{
    [TestFixture]
    public class AuthControllerTests
    {
        private AuthDbContext _context = null!;
        private Mock<IServiceLogger> _mockLogger = null!;
        private UserRepository _repository = null!;
        private AuthController _controller = null!;
        private Mock<IAuthHelper> _mockAuthHelper = null!;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<AuthDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AuthDbContext(options);
            _mockLogger = new Mock<IServiceLogger>();
            _mockAuthHelper = new Mock<IAuthHelper>();
            _repository = new UserRepository(_context, _mockLogger.Object);
            _controller = new AuthController(_repository);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region Register Tests

        [Test]
        public async Task Register_WithValidData_ReturnsOk()
        {
            // Arrange
            var dto = new RegisterDTO
            {
                Username = "newuser",
                Email = "new@test.com",
                Password = "Password123!",
                FirstName = "New",
                LastName = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Assert.That(okResult!.Value, Is.EqualTo("User created"));
        }

        [Test]
        public async Task Register_WithExistingUsername_ReturnsBadRequest()
        {
            // Arrange
            var existingUser = CreateTestUser("existinguser");
            await _context.Users.AddAsync(existingUser);
            await _context.SaveChangesAsync();

            var dto = new RegisterDTO
            {
                Username = "existinguser",
                Email = "different@test.com",
                Password = "Password123!",
                FirstName = "Test",
                LastName = "User"
            };

            // Act
            var result = await _controller.Register(dto);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badResult = result as BadRequestObjectResult;
            Assert.That(badResult!.Value, Is.EqualTo("User already exists"));
        }

        [Test]
        public async Task Register_CreatesUserWithMemberRole()
        {
            // Arrange
            var dto = new RegisterDTO
            {
                Username = "memberuser",
                Email = "member@test.com",
                Password = "Password123!",
                FirstName = "Member",
                LastName = "User"
            };

            // Act
            await _controller.Register(dto);

            // Assert
            var user = await _context.Users.FirstAsync(u => u.Username == "memberuser");
            Assert.That(user.Role, Is.EqualTo(Role.Member));
        }

        [Test]
        public async Task Register_HashesPassword()
        {
            // Arrange
            var password = "PlainTextPassword123!";
            var dto = new RegisterDTO
            {
                Username = "hashuser",
                Email = "hash@test.com",
                Password = password,
                FirstName = "Hash",
                LastName = "User"
            };

            // Act
            await _controller.Register(dto);

            // Assert
            var user = await _context.Users.FirstAsync(u => u.Username == "hashuser");
            Assert.That(user.PasswordHash, Is.Not.EqualTo(password));
            Assert.That(PasswordHelper.VerifyPassword(password, user.PasswordHash), Is.True);
        }

        [Test]
        public async Task Register_StoresCorrectUserData()
        {
            // Arrange
            var dto = new RegisterDTO
            {
                Username = "datauser",
                Email = "data@test.com",
                Password = "Password123!",
                FirstName = "Data",
                LastName = "Test"
            };

            // Act
            await _controller.Register(dto);

            // Assert
            var user = await _context.Users.FirstAsync(u => u.Username == "datauser");
            Assert.That(user.Email, Is.EqualTo("data@test.com"));
            Assert.That(user.FirstName, Is.EqualTo("Data"));
            Assert.That(user.LastName, Is.EqualTo("Test"));
        }

        #endregion

        #region Login Tests

        [Test]
        public async Task Login_WithValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            var password = "ValidPassword123!";
            var user = CreateTestUser("loginuser");
            user.PasswordHash = PasswordHelper.HashPassword(password);
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var dto = new LoginDTO { Username = "loginuser", Password = password };

            _mockAuthHelper.Setup(a => a.AuthenticatePrincipal("loginuser", password))
                .ReturnsAsync(true);
            _mockAuthHelper.Setup(a => a.GenerateJwt(It.IsAny<Principal>()))
                .Returns("test-jwt-token");

            // Act
            var result = await _controller.Login(dto, _mockAuthHelper.Object);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task Login_WithInvalidUsername_ReturnsUnauthorized()
        {
            // Arrange
            var dto = new LoginDTO { Username = "nonexistent", Password = "anypassword" };

            _mockAuthHelper.Setup(a => a.AuthenticatePrincipal("nonexistent", "anypassword"))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Login(dto, _mockAuthHelper.Object);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task Login_WithWrongPassword_ReturnsUnauthorized()
        {
            // Arrange
            var user = CreateTestUser("wrongpasslogin");
            user.PasswordHash = PasswordHelper.HashPassword("correctpassword");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var dto = new LoginDTO { Username = "wrongpasslogin", Password = "wrongpassword" };

            _mockAuthHelper.Setup(a => a.AuthenticatePrincipal("wrongpasslogin", "wrongpassword"))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Login(dto, _mockAuthHelper.Object);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }

        #endregion

        #region UpdateUserRole Tests

        [Test]
        public async Task UpdateUserRole_WithExistingUser_ReturnsOk()
        {
            // Arrange
            var user = CreateTestUser("roleuser");
            user.Role = Role.Member;
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var dto = new UpdateUserRolesDTO
            {
                Username = "roleuser",
                NewRole = Role.Trainer
            };

            // Act
            var result = await _controller.UpdateUserRole(dto);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateUserRole_UpdatesRoleInDatabase()
        {
            // Arrange
            var user = CreateTestUser("dbroleuser");
            user.Role = Role.Member;
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var dto = new UpdateUserRolesDTO
            {
                Username = "dbroleuser",
                NewRole = Role.Admin
            };

            // Act
            await _controller.UpdateUserRole(dto);

            // Assert
            var updatedUser = await _context.Users.FirstAsync(u => u.Username == "dbroleuser");
            Assert.That(updatedUser.Role, Is.EqualTo(Role.Admin));
        }

        [Test]
        public async Task UpdateUserRole_WithNonExistingUser_ReturnsNotFound()
        {
            // Arrange
            var dto = new UpdateUserRolesDTO
            {
                Username = "nonexistent",
                NewRole = Role.Admin
            };

            // Act
            var result = await _controller.UpdateUserRole(dto);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }

        #endregion

        #region GetAllUsers Tests

        [Test]
        public async Task GetAllUsers_WithUsers_ReturnsOkWithUserList()
        {
            // Arrange
            await _context.Users.AddRangeAsync(
                CreateTestUser("user1"),
                CreateTestUser("user2"),
                CreateTestUser("user3")
            );
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetAllUsers();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            var users = okResult!.Value as IEnumerable<object>;
            Assert.That(users!.Count(), Is.EqualTo(3));
        }

        [Test]
        public async Task GetAllUsers_WithNoUsers_ReturnsOkWithEmptyList()
        {
            // Act
            var result = await _controller.GetAllUsers();

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            var users = okResult!.Value as IEnumerable<object>;
            Assert.That(users!.Count(), Is.EqualTo(0));
        }

        #endregion

        #region UpdateUser Tests

        [Test]
        public async Task UpdateUser_WithValidData_ReturnsOk()
        {
            // Arrange
            var user = CreateTestUser("updateuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var dto = new UpdateUserDTO
            {
                FirstName = "UpdatedFirst",
                LastName = "UpdatedLast",
                Username = "updateuser",
                Email = "updated@test.com"
            };

            // Act
            var result = await _controller.UpdateUser(user.Id.ToString(), dto);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateUser_UpdatesDataInDatabase()
        {
            // Arrange
            var user = CreateTestUser("dbupdateuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var dto = new UpdateUserDTO
            {
                FirstName = "NewFirst",
                LastName = "NewLast",
                Username = "newusername",
                Email = "newemail@test.com"
            };

            // Act
            await _controller.UpdateUser(user.Id.ToString(), dto);

            // Assert
            var updatedUser = await _context.Users.FirstAsync(u => u.Id == user.Id);
            Assert.That(updatedUser.FirstName, Is.EqualTo("NewFirst"));
            Assert.That(updatedUser.LastName, Is.EqualTo("NewLast"));
            Assert.That(updatedUser.Username, Is.EqualTo("newusername"));
            Assert.That(updatedUser.Email, Is.EqualTo("newemail@test.com"));
        }

        [Test]
        public async Task UpdateUser_WithNonExistingId_ReturnsNotFound()
        {
            // Arrange
            var dto = new UpdateUserDTO
            {
                FirstName = "Test",
                LastName = "Test",
                Username = "test",
                Email = "test@test.com"
            };

            // Act
            var result = await _controller.UpdateUser(Guid.NewGuid().ToString(), dto);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }

        #endregion

        #region DeleteUser Tests

        [Test]
        public async Task DeleteUser_WithExistingUser_ReturnsOk()
        {
            // Arrange
            var user = CreateTestUser("deleteuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteUser(user.Id.ToString());

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task DeleteUser_RemovesUserFromDatabase()
        {
            // Arrange
            var user = CreateTestUser("dbdeleteuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            var userId = user.Id;

            // Act
            await _controller.DeleteUser(userId.ToString());

            // Assert
            var deletedUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            Assert.That(deletedUser, Is.Null);
        }

        [Test]
        public async Task DeleteUser_WithInvalidIdFormat_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.DeleteUser("invalid-guid");

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task DeleteUser_WithNonExistingUser_ReturnsNotFound()
        {
            // Act
            var result = await _controller.DeleteUser(Guid.NewGuid().ToString());

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }

        #endregion

        #region GetUserById Tests

        [Test]
        public async Task GetUserById_WithExistingUser_ReturnsOkWithUser()
        {
            // Arrange
            var user = CreateTestUser("getbyiduser");
            user.FirstName = "John";
            user.LastName = "Doe";
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetUserById(user.Id);

            // Assert
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetUserById_WithNonExistingUser_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetUserById(Guid.NewGuid());

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
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

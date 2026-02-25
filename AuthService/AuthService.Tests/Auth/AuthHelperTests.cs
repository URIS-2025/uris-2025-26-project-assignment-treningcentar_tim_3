using AuthService.Data;
using AuthService.Data.Auth;
using AuthService.Helpers;
using AuthService.Models;
using AuthService.Models.DTO;
using AuthService.Repositories;
using AuthService.ServiceCalls.Logger;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using NUnit.Framework;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AuthService.Tests.Auth
{
    [TestFixture]
    public class AuthHelperTests
    {
        private AuthDbContext _context = null!;
        private Mock<IServiceLogger> _mockLogger = null!;
        private UserRepository _repository = null!;
        private AuthHelper _authHelper = null!;
        private IConfiguration _configuration = null!;

        // Test JWT key (Base64 encoded, at least 256 bits for HS256)
        private const string TestJwtKey = "dGVzdC1qd3Qta2V5LWZvci10ZXN0aW5nLXB1cnBvc2VzLW9ubHktMTIzNDU2Nzg5MA==";
        private const string TestIssuer = "TestIssuer";

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<AuthDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AuthDbContext(options);
            _mockLogger = new Mock<IServiceLogger>();
            _repository = new UserRepository(_context, _mockLogger.Object);

            var configData = new Dictionary<string, string?>
            {
                { "Jwt:Key", TestJwtKey },
                { "Jwt:Issuer", TestIssuer }
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configData)
                .Build();

            _authHelper = new AuthHelper(_configuration, _repository);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region AuthenticatePrincipal Tests

        [Test]
        public async Task AuthenticatePrincipal_WithValidCredentials_ReturnsTrue()
        {
            // Arrange
            var password = "ValidPassword123!";
            var user = CreateTestUser("authuser");
            user.PasswordHash = PasswordHelper.HashPassword(password);
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _authHelper.AuthenticatePrincipal("authuser", password);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task AuthenticatePrincipal_WithInvalidPassword_ReturnsFalse()
        {
            // Arrange
            var user = CreateTestUser("invalidpassuser");
            user.PasswordHash = PasswordHelper.HashPassword("correctpassword");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _authHelper.AuthenticatePrincipal("invalidpassuser", "wrongpassword");

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task AuthenticatePrincipal_WithNonExistingUser_ReturnsFalse()
        {
            // Act
            var result = await _authHelper.AuthenticatePrincipal("nonexistent", "anypassword");

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task AuthenticatePrincipal_WithEmptyUsername_ReturnsFalse()
        {
            // Act
            var result = await _authHelper.AuthenticatePrincipal("", "anypassword");

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task AuthenticatePrincipal_WithEmptyPassword_ReturnsFalse()
        {
            // Arrange
            var user = CreateTestUser("emptypassuser");
            user.PasswordHash = PasswordHelper.HashPassword("actualpassword");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _authHelper.AuthenticatePrincipal("emptypassuser", "");

            // Assert
            Assert.That(result, Is.False);
        }

        #endregion

        #region GenerateJwt Tests

        [Test]
        public void GenerateJwt_WithValidPrincipal_ReturnsToken()
        {
            // Arrange
            var principal = CreateTestPrincipal();

            // Act
            var token = _authHelper.GenerateJwt(principal);

            // Assert
            Assert.That(token, Is.Not.Null);
            Assert.That(token, Is.Not.Empty);
        }

        [Test]
        public void GenerateJwt_ReturnsValidJwtFormat()
        {
            // Arrange
            var principal = CreateTestPrincipal();

            // Act
            var token = _authHelper.GenerateJwt(principal);

            // Assert - JWT tokens have 3 parts separated by dots
            var parts = token.Split('.');
            Assert.That(parts.Length, Is.EqualTo(3));
        }

        [Test]
        public void GenerateJwt_TokenContainsSubjectClaim()
        {
            // Arrange
            var principal = CreateTestPrincipal();

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
            Assert.That(subClaim, Is.Not.Null);
            Assert.That(subClaim!.Value, Is.EqualTo(principal.Id.ToString()));
        }

        [Test]
        public void GenerateJwt_TokenContainsUsernameClaim()
        {
            // Arrange
            var principal = CreateTestPrincipal();

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            var nameClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.UniqueName);
            Assert.That(nameClaim, Is.Not.Null);
            Assert.That(nameClaim!.Value, Is.EqualTo(principal.Username));
        }

        [Test]
        public void GenerateJwt_TokenContainsRoleClaims()
        {
            // Arrange
            var principal = new Principal(
                Guid.NewGuid(),
                "roleuser",
                "role@test.com",
                new List<Role> { Role.Admin, Role.Trainer }
            );

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            var roleClaims = jwtToken.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
            Assert.That(roleClaims.Count, Is.EqualTo(2));
            Assert.That(roleClaims.Any(c => c.Value == "Admin"), Is.True);
            Assert.That(roleClaims.Any(c => c.Value == "Trainer"), Is.True);
        }

        [Test]
        public void GenerateJwt_TokenContainsIssuerClaim()
        {
            // Arrange
            var principal = CreateTestPrincipal();

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            Assert.That(jwtToken.Issuer, Is.EqualTo(TestIssuer));
        }

        [Test]
        public void GenerateJwt_TokenContainsAudienceClaim()
        {
            // Arrange
            var principal = CreateTestPrincipal();

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            Assert.That(jwtToken.Audiences.Contains(TestIssuer), Is.True);
        }

        [Test]
        public void GenerateJwt_TokenHasExpirationTime()
        {
            // Arrange
            var principal = CreateTestPrincipal();

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            Assert.That(jwtToken.ValidTo, Is.GreaterThan(DateTime.UtcNow));
        }

        [Test]
        public void GenerateJwt_TokenExpiresIn120Minutes()
        {
            // Arrange
            var principal = CreateTestPrincipal();
            var beforeGeneration = DateTime.Now;

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert - Token should expire approximately 120 minutes from now
            var expectedExpiry = beforeGeneration.AddMinutes(120);
            var actualExpiry = jwtToken.ValidTo.ToLocalTime();
            
            // Allow 1 minute tolerance for test execution time
            Assert.That(actualExpiry, Is.EqualTo(expectedExpiry).Within(TimeSpan.FromMinutes(1)));
        }

        [Test]
        public void GenerateJwt_TokenContainsUniqueJti()
        {
            // Arrange
            var principal = CreateTestPrincipal();

            // Act
            var token1 = _authHelper.GenerateJwt(principal);
            var token2 = _authHelper.GenerateJwt(principal);
            
            var handler = new JwtSecurityTokenHandler();
            var jwtToken1 = handler.ReadJwtToken(token1);
            var jwtToken2 = handler.ReadJwtToken(token2);

            // Assert - Each token should have a unique JTI
            var jti1 = jwtToken1.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
            var jti2 = jwtToken2.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
            
            Assert.That(jti1, Is.Not.Null);
            Assert.That(jti2, Is.Not.Null);
            Assert.That(jti1, Is.Not.EqualTo(jti2));
        }

        [Test]
        public void GenerateJwt_WithSingleRole_ContainsOneRoleClaim()
        {
            // Arrange
            var principal = new Principal(
                Guid.NewGuid(),
                "singlerole",
                "single@test.com",
                new List<Role> { Role.Member }
            );

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            var roleClaims = jwtToken.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
            Assert.That(roleClaims.Count, Is.EqualTo(1));
            Assert.That(roleClaims[0].Value, Is.EqualTo("Member"));
        }

        [Test]
        public void GenerateJwt_WithEmptyRoles_ContainsNoRoleClaims()
        {
            // Arrange
            var principal = new Principal(
                Guid.NewGuid(),
                "noroles",
                "noroles@test.com",
                new List<Role>()
            );

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            var roleClaims = jwtToken.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
            Assert.That(roleClaims.Count, Is.EqualTo(0));
        }

        [Test]
        public void GenerateJwt_WithAllRoles_ContainsAllRoleClaims()
        {
            // Arrange
            var allRoles = new List<Role> 
            { 
                Role.Admin, 
                Role.Member, 
                Role.Trainer, 
                Role.Nutritionist, 
                Role.Receptionist 
            };
            var principal = new Principal(
                Guid.NewGuid(),
                "allroles",
                "allroles@test.com",
                allRoles
            );

            // Act
            var token = _authHelper.GenerateJwt(principal);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            var roleClaims = jwtToken.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
            Assert.That(roleClaims.Count, Is.EqualTo(5));
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

        private static Principal CreateTestPrincipal()
        {
            return new Principal(
                Guid.NewGuid(),
                "testuser",
                "test@test.com",
                new List<Role> { Role.Member }
            );
        }

        #endregion
    }
}

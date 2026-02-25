using AuthService.Models;
using AuthService.Models.DTO;
using NUnit.Framework;

namespace AuthService.Tests.Models
{
    [TestFixture]
    public class UserEntityTests
    {
        #region Default Values Tests

        [Test]
        public void UserEntity_DefaultRole_IsMember()
        {
            // Arrange & Act
            var user = new UserEntity();

            // Assert
            Assert.That(user.Role, Is.EqualTo(Role.Member));
        }

        [Test]
        public void UserEntity_NewInstance_HasEmptyGuid()
        {
            // Arrange & Act
            var user = new UserEntity();

            // Assert
            Assert.That(user.Id, Is.EqualTo(Guid.Empty));
        }

        #endregion

        #region Property Assignment Tests

        [Test]
        public void UserEntity_SetAllProperties_PropertiesAreSet()
        {
            // Arrange
            var id = Guid.NewGuid();
            var user = new UserEntity
            {
                Id = id,
                Username = "testuser",
                Email = "test@example.com",
                FirstName = "John",
                LastName = "Doe",
                PasswordHash = "hashedpassword",
                Role = Role.Admin
            };

            // Assert
            Assert.That(user.Id, Is.EqualTo(id));
            Assert.That(user.Username, Is.EqualTo("testuser"));
            Assert.That(user.Email, Is.EqualTo("test@example.com"));
            Assert.That(user.FirstName, Is.EqualTo("John"));
            Assert.That(user.LastName, Is.EqualTo("Doe"));
            Assert.That(user.PasswordHash, Is.EqualTo("hashedpassword"));
            Assert.That(user.Role, Is.EqualTo(Role.Admin));
        }

        [Test]
        public void UserEntity_CanAssignAllRoles()
        {
            // Arrange
            var user = new UserEntity();

            // Act & Assert for each role
            user.Role = Role.Admin;
            Assert.That(user.Role, Is.EqualTo(Role.Admin));

            user.Role = Role.Member;
            Assert.That(user.Role, Is.EqualTo(Role.Member));

            user.Role = Role.Trainer;
            Assert.That(user.Role, Is.EqualTo(Role.Trainer));

            user.Role = Role.Nutritionist;
            Assert.That(user.Role, Is.EqualTo(Role.Nutritionist));

            user.Role = Role.Receptionist;
            Assert.That(user.Role, Is.EqualTo(Role.Receptionist));
        }

        #endregion
    }

    [TestFixture]
    public class RoleEnumTests
    {
        [Test]
        public void Role_HasCorrectValues()
        {
            // Assert
            Assert.That((int)Role.Admin, Is.EqualTo(0));
            Assert.That((int)Role.Member, Is.EqualTo(1));
            Assert.That((int)Role.Trainer, Is.EqualTo(2));
            Assert.That((int)Role.Nutritionist, Is.EqualTo(3));
            Assert.That((int)Role.Receptionist, Is.EqualTo(4));
        }

        [Test]
        public void Role_HasFiveValues()
        {
            // Assert
            var values = Enum.GetValues(typeof(Role));
            Assert.That(values.Length, Is.EqualTo(5));
        }

        [Test]
        public void Role_CanConvertToString()
        {
            // Assert
            Assert.That(Role.Admin.ToString(), Is.EqualTo("Admin"));
            Assert.That(Role.Member.ToString(), Is.EqualTo("Member"));
            Assert.That(Role.Trainer.ToString(), Is.EqualTo("Trainer"));
            Assert.That(Role.Nutritionist.ToString(), Is.EqualTo("Nutritionist"));
            Assert.That(Role.Receptionist.ToString(), Is.EqualTo("Receptionist"));
        }

        [Test]
        public void Role_CanParseFromString()
        {
            // Assert
            Assert.That(Enum.Parse<Role>("Admin"), Is.EqualTo(Role.Admin));
            Assert.That(Enum.Parse<Role>("Member"), Is.EqualTo(Role.Member));
            Assert.That(Enum.Parse<Role>("Trainer"), Is.EqualTo(Role.Trainer));
            Assert.That(Enum.Parse<Role>("Nutritionist"), Is.EqualTo(Role.Nutritionist));
            Assert.That(Enum.Parse<Role>("Receptionist"), Is.EqualTo(Role.Receptionist));
        }
    }

    [TestFixture]
    public class RegisterDTOTests
    {
        [Test]
        public void RegisterDTO_CanSetAllProperties()
        {
            // Arrange & Act
            var dto = new RegisterDTO
            {
                FirstName = "John",
                LastName = "Doe",
                Username = "johndoe",
                Email = "john@example.com",
                Password = "password123"
            };

            // Assert
            Assert.That(dto.FirstName, Is.EqualTo("John"));
            Assert.That(dto.LastName, Is.EqualTo("Doe"));
            Assert.That(dto.Username, Is.EqualTo("johndoe"));
            Assert.That(dto.Email, Is.EqualTo("john@example.com"));
            Assert.That(dto.Password, Is.EqualTo("password123"));
        }
    }

    [TestFixture]
    public class LoginDTOTests
    {
        [Test]
        public void LoginDTO_CanSetAllProperties()
        {
            // Arrange & Act
            var dto = new LoginDTO
            {
                Username = "testuser",
                Password = "testpass"
            };

            // Assert
            Assert.That(dto.Username, Is.EqualTo("testuser"));
            Assert.That(dto.Password, Is.EqualTo("testpass"));
        }
    }

    [TestFixture]
    public class UpdateUserDTOTests
    {
        [Test]
        public void UpdateUserDTO_CanSetAllProperties()
        {
            // Arrange & Act
            var dto = new UpdateUserDTO
            {
                FirstName = "Updated",
                LastName = "User",
                Username = "updateduser",
                Email = "updated@example.com"
            };

            // Assert
            Assert.That(dto.FirstName, Is.EqualTo("Updated"));
            Assert.That(dto.LastName, Is.EqualTo("User"));
            Assert.That(dto.Username, Is.EqualTo("updateduser"));
            Assert.That(dto.Email, Is.EqualTo("updated@example.com"));
        }
    }

    [TestFixture]
    public class UpdateUserRolesDTOTests
    {
        [Test]
        public void UpdateUserRolesDTO_CanSetAllProperties()
        {
            // Arrange & Act
            var dto = new UpdateUserRolesDTO
            {
                Username = "roleuser",
                NewRole = Role.Trainer
            };

            // Assert
            Assert.That(dto.Username, Is.EqualTo("roleuser"));
            Assert.That(dto.NewRole, Is.EqualTo(Role.Trainer));
        }

        [Test]
        public void UpdateUserRolesDTO_CanAssignAnyRole()
        {
            // Arrange
            var dto = new UpdateUserRolesDTO { Username = "test" };

            // Act & Assert
            dto.NewRole = Role.Admin;
            Assert.That(dto.NewRole, Is.EqualTo(Role.Admin));

            dto.NewRole = Role.Member;
            Assert.That(dto.NewRole, Is.EqualTo(Role.Member));

            dto.NewRole = Role.Nutritionist;
            Assert.That(dto.NewRole, Is.EqualTo(Role.Nutritionist));
        }
    }

    [TestFixture]
    public class PrincipalTests
    {
        [Test]
        public void Principal_ParameterlessConstructor_CreatesInstance()
        {
            // Arrange & Act
            var principal = new Principal();

            // Assert
            Assert.That(principal, Is.Not.Null);
        }

        [Test]
        public void Principal_ParameterizedConstructor_SetsProperties()
        {
            // Arrange
            var id = Guid.NewGuid();
            var roles = new List<Role> { Role.Admin, Role.Member };

            // Act
            var principal = new Principal(id, "testuser", "test@test.com", roles);

            // Assert
            Assert.That(principal.Id, Is.EqualTo(id));
            Assert.That(principal.Username, Is.EqualTo("testuser"));
            Assert.That(principal.Email, Is.EqualTo("test@test.com"));
            Assert.That(principal.Roles.Count, Is.EqualTo(2));
            Assert.That(principal.Roles.Contains(Role.Admin), Is.True);
            Assert.That(principal.Roles.Contains(Role.Member), Is.True);
        }

        [Test]
        public void Principal_EmptyRoles_IsValid()
        {
            // Arrange & Act
            var principal = new Principal(Guid.NewGuid(), "user", "email@test.com", new List<Role>());

            // Assert
            Assert.That(principal.Roles, Is.Empty);
        }

        [Test]
        public void Principal_Roles_CanBeMutated()
        {
            // Arrange
            var principal = new Principal(Guid.NewGuid(), "user", "email@test.com", new List<Role> { Role.Member });

            // Act
            principal.Roles.Add(Role.Admin);

            // Assert
            Assert.That(principal.Roles.Count, Is.EqualTo(2));
        }
    }
}

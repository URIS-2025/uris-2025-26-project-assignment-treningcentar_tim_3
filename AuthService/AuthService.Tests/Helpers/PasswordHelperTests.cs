using AuthService.Helpers;
using NUnit.Framework;

namespace AuthService.Tests.Helpers
{
    [TestFixture]
    public class PasswordHelperTests
    {
        #region HashPassword Tests

        [Test]
        public void HashPassword_WithValidPassword_ReturnsHashedString()
        {
            // Arrange
            var password = "TestPassword123!";

            // Act
            var hash = PasswordHelper.HashPassword(password);

            // Assert
            Assert.That(hash, Is.Not.Null);
            Assert.That(hash, Is.Not.Empty);
            Assert.That(hash, Is.Not.EqualTo(password));
        }

        [Test]
        public void HashPassword_WithSamePassword_ReturnsDifferentHashes()
        {
            // Arrange
            var password = "TestPassword123!";

            // Act
            var hash1 = PasswordHelper.HashPassword(password);
            var hash2 = PasswordHelper.HashPassword(password);

            // Assert - BCrypt generates different hashes each time due to random salt
            Assert.That(hash1, Is.Not.EqualTo(hash2));
        }

        [Test]
        public void HashPassword_WithEmptyString_ReturnsHash()
        {
            // Arrange
            var password = "";

            // Act
            var hash = PasswordHelper.HashPassword(password);

            // Assert
            Assert.That(hash, Is.Not.Null);
            Assert.That(hash, Is.Not.Empty);
        }

        [Test]
        public void HashPassword_WithSpecialCharacters_ReturnsHash()
        {
            // Arrange
            var password = "P@$$w0rd!#%^&*()";

            // Act
            var hash = PasswordHelper.HashPassword(password);

            // Assert
            Assert.That(hash, Is.Not.Null);
            Assert.That(hash.Length, Is.GreaterThan(0));
        }

        [Test]
        public void HashPassword_WithUnicodeCharacters_ReturnsHash()
        {
            // Arrange
            var password = "пароль密码🔐";

            // Act
            var hash = PasswordHelper.HashPassword(password);

            // Assert
            Assert.That(hash, Is.Not.Null);
            Assert.That(hash, Is.Not.Empty);
        }

        [Test]
        public void HashPassword_WithLongPassword_ReturnsHash()
        {
            // Arrange
            var password = new string('a', 1000);

            // Act
            var hash = PasswordHelper.HashPassword(password);

            // Assert
            Assert.That(hash, Is.Not.Null);
            Assert.That(hash, Is.Not.Empty);
        }

        #endregion

        #region VerifyPassword Tests

        [Test]
        public void VerifyPassword_WithCorrectPassword_ReturnsTrue()
        {
            // Arrange
            var password = "TestPassword123!";
            var hash = PasswordHelper.HashPassword(password);

            // Act
            var result = PasswordHelper.VerifyPassword(password, hash);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public void VerifyPassword_WithIncorrectPassword_ReturnsFalse()
        {
            // Arrange
            var password = "TestPassword123!";
            var wrongPassword = "WrongPassword456!";
            var hash = PasswordHelper.HashPassword(password);

            // Act
            var result = PasswordHelper.VerifyPassword(wrongPassword, hash);

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public void VerifyPassword_WithEmptyPassword_AgainstEmptyHash_ReturnsTrue()
        {
            // Arrange
            var password = "";
            var hash = PasswordHelper.HashPassword(password);

            // Act
            var result = PasswordHelper.VerifyPassword(password, hash);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public void VerifyPassword_WithCaseSensitivePassword_ReturnsFalse()
        {
            // Arrange
            var password = "TestPassword";
            var wrongCasePassword = "testpassword";
            var hash = PasswordHelper.HashPassword(password);

            // Act
            var result = PasswordHelper.VerifyPassword(wrongCasePassword, hash);

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public void VerifyPassword_WithSpecialCharacters_ReturnsTrue()
        {
            // Arrange
            var password = "P@$$w0rd!#%^&*()";
            var hash = PasswordHelper.HashPassword(password);

            // Act
            var result = PasswordHelper.VerifyPassword(password, hash);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public void VerifyPassword_WithWhitespace_ReturnsTrue()
        {
            // Arrange
            var password = "password with spaces";
            var hash = PasswordHelper.HashPassword(password);

            // Act
            var result = PasswordHelper.VerifyPassword(password, hash);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public void VerifyPassword_WithLeadingTrailingSpaces_ReturnsFalse()
        {
            // Arrange
            var password = "password";
            var passwordWithSpaces = " password ";
            var hash = PasswordHelper.HashPassword(password);

            // Act
            var result = PasswordHelper.VerifyPassword(passwordWithSpaces, hash);

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public void VerifyPassword_WithUnicodeCharacters_ReturnsTrue()
        {
            // Arrange
            var password = "пароль密码🔐";
            var hash = PasswordHelper.HashPassword(password);

            // Act
            var result = PasswordHelper.VerifyPassword(password, hash);

            // Assert
            Assert.That(result, Is.True);
        }

        #endregion

        #region Edge Cases

        [Test]
        public void HashPassword_ProducesBCryptFormat()
        {
            // Arrange
            var password = "TestPassword";

            // Act
            var hash = PasswordHelper.HashPassword(password);

            // Assert - BCrypt hashes start with $2
            Assert.That(hash, Does.StartWith("$2"));
        }

        [Test]
        public void HashPassword_ProducesConsistentLength()
        {
            // Arrange & Act
            var hash1 = PasswordHelper.HashPassword("short");
            var hash2 = PasswordHelper.HashPassword("this is a much longer password");

            // Assert - BCrypt always produces 60 character hashes
            Assert.That(hash1.Length, Is.EqualTo(60));
            Assert.That(hash2.Length, Is.EqualTo(60));
        }

        #endregion
    }
}

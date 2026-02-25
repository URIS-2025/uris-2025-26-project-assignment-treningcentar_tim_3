using AutoMapper;
using MembershipService.Context;
using MembershipService.Models;
using MembershipService.Models.DTO;
using MembershipService.Models.Enums;
using MembershipService.Profiles;
using MembershipService.ServiceCalls.Auth;
using MembershipService.ServiceCalls.Logger;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace MembershipService.Tests.Helpers;


/// Helper class providing shared utilities for tests.
public static class TestHelpers
{
   
    /// Creates an InMemory MembershipContext for testing.
    public static MembershipContext CreateInMemoryContext(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<MembershipContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .Options;

        return new MembershipContext(options);
    }


    /// Creates an AutoMapper instance with the MembershipProfile.
    public static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<MembershipProfile>();
        });
        return config.CreateMapper();
    }


    /// Creates a mock IAuthService that always returns user exists = true.
    public static Mock<IAuthService> CreateMockAuthService(bool userExists = true)
    {
        var mock = new Mock<IAuthService>();
        mock.Setup(x => x.UserExists(It.IsAny<Guid>())).Returns(userExists);
        mock.Setup(x => x.GetUserById(It.IsAny<Guid>())).Returns(userExists
            ? new UserInfoDto
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@test.com",
                FirstName = "Test",
                LastName = "User",
                Role = "Member"
            }
            : null);
        return mock;
    }

  
    /// Creates a mock ILoggerService that does nothing.
    public static Mock<ILoggerService> CreateMockLoggerService()
    {
        var mock = new Mock<ILoggerService>();
        mock.Setup(x => x.LogInfoAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string?>()))
            .ReturnsAsync(true);
        mock.Setup(x => x.LogErrorAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string?>()))
            .ReturnsAsync(true);
        mock.Setup(x => x.LogWarningAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string?>()))
            .ReturnsAsync(true);
        return mock;
    }


    /// Seeds a Package into the context and returns it.
    public static Package SeedPackage(MembershipContext context, string name = "Basic", double price = 29.99, int duration = 30)
    {
        var package = new Package
        {
            PackageId = Guid.NewGuid(),
            Name = name,
            Description = $"{name} membership package",
            Price = price,
            Duration = duration,
            Services = new List<string> { "Gym Access", "Locker" }
        };
        context.Packages.Add(package);
        context.SaveChanges();
        return package;
    }


    /// Seeds a Membership into the context and returns it.
    public static Membership SeedMembership(
        MembershipContext context,
        Guid userId,
        Guid packageId,
        MembershipStatus status = MembershipStatus.Active,
        int daysUntilExpiry = 30)
    {
        var membership = new Membership
        {
            MembershipId = Guid.NewGuid(),
            UserId = userId,
            PackageId = packageId,
            StartDate = DateTime.UtcNow.AddDays(-5),
            EndDate = DateTime.UtcNow.AddDays(daysUntilExpiry),
            CreatedDate = DateTime.UtcNow,
            Status = status
        };
        context.Memberships.Add(membership);
        context.SaveChanges();
        return membership;
    }


    /// Seeds a Checkin into the context and returns it.
    public static Checkin SeedCheckin(MembershipContext context, Guid membershipId, DateTime? timestamp = null, string location = "Main Entrance")
    {
        var checkin = new Checkin
        {
            CheckinId = Guid.NewGuid(),
            MembershipId = membershipId,
            Timestamp = timestamp ?? DateTime.UtcNow.AddDays(-1),
            Location = location
        };
        context.Checkins.Add(checkin);
        context.SaveChanges();
        return checkin;
    }
}

using MembershipService.Context;
using MembershipService.Data;
using MembershipService.ServiceCalls.Auth;
using MembershipService.ServiceCalls.Logger;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace MembershipService.Tests.IntegrationTests;


/// Custom WebApplicationFactory that replaces PostgreSQL with InMemory database
/// and mocks external service calls (AuthService, LoggerService).
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
    
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<MembershipContext>));
            if (descriptor != null)
                services.Remove(descriptor);

         
            var contextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(MembershipContext));
            if (contextDescriptor != null)
                services.Remove(contextDescriptor);

            
            var dbName = "IntegrationTestDb_" + Guid.NewGuid().ToString();
            services.AddDbContext<MembershipContext>(options =>
                options.UseInMemoryDatabase(dbName));

            var authDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IAuthService));
            if (authDescriptor != null)
                services.Remove(authDescriptor);

            var mockAuth = new Mock<IAuthService>();
            mockAuth.Setup(x => x.UserExists(It.IsAny<Guid>())).Returns(true);
            mockAuth.Setup(x => x.GetUserById(It.IsAny<Guid>())).Returns(
                new MembershipService.Models.DTO.UserInfoDto
                {
                    Id = Guid.NewGuid(),
                    Username = "testuser",
                    Email = "test@test.com",
                    FirstName = "Test",
                    LastName = "User",
                    Role = "Member"
                });
            services.AddScoped<IAuthService>(_ => mockAuth.Object);

            var loggerDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(ILoggerService));
            if (loggerDescriptor != null)
                services.Remove(loggerDescriptor);

            var mockLogger = new Mock<ILoggerService>();
            mockLogger.Setup(x => x.LogInfoAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string?>()))
                .ReturnsAsync(true);
            mockLogger.Setup(x => x.LogErrorAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string?>()))
                .ReturnsAsync(true);
            mockLogger.Setup(x => x.LogWarningAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string?>()))
                .ReturnsAsync(true);
            services.AddScoped<ILoggerService>(_ => mockLogger.Object);
        });

        builder.UseEnvironment("Development");
    }
}

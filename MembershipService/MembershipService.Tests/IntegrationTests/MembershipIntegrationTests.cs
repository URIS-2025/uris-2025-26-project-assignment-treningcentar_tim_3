using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using MembershipService.Context;
using MembershipService.Models;
using MembershipService.Models.DTO;
using MembershipService.Models.Enums;
using Microsoft.Extensions.DependencyInjection;
using FluentAssertions;
using Xunit;

namespace MembershipService.Tests.IntegrationTests;


/// Integration tests for Membership endpoints (api/Membership).
/// These include JWT Auth since MembershipController uses [Authorize].
public class MembershipIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public MembershipIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }


    /// Generates a JWT token for testing with configurable claims.
    private string GenerateTestToken(Guid userId, string role = "Member")
    {
        // Read the JWT key from the app configuration
        using var scope = _factory.Services.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
        var key = config["Jwt:Key"] ?? "h33BGj0Yq9+7X7s4k2X7CMwSNHNAFABZSpM/fD1u1L8=";
        var issuer = config["Jwt:Issuer"] ?? "MyAuthService";

        var securityKey = new SymmetricSecurityKey(Convert.FromBase64String(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, "testuser"),
            new Claim(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void SetAuthHeader(Guid userId, string role = "Member")
    {
        var token = GenerateTestToken(userId, role);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private Guid SeedPackageAndGetId()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MembershipContext>();
        var package = new Package
        {
            PackageId = Guid.NewGuid(),
            Name = "Test Package",
            Description = "For integration tests",
            Price = 29.99,
            Duration = 30,
            Services = new List<string> { "Gym" }
        };
        context.Packages.Add(package);
        context.SaveChanges();
        return package.PackageId;
    }

    //  No Auth caused 401 
    [Fact]
    public async Task GetMemberships_NoAuth_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.GetAsync("/api/Membership");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    //  GET api/Membership 

    [Fact]
    public async Task GetMemberships_Authenticated_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId);

        var response = await _client.GetAsync("/api/Membership");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    //  POST api/Membership 

    [Fact]
    public async Task CreateMembership_ValidDto_ReturnsCreated()
    {
        var userId = Guid.NewGuid();
        var packageId = SeedPackageAndGetId();
        SetAuthHeader(userId);

        var dto = new CreateMembershipDto
        {
            PackageId = packageId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = MembershipStatus.Active
        };
        var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/Membership", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<MembershipDto>(_jsonOptions);
        created.Should().NotBeNull();
        created!.UserId.Should().Be(userId);
        created.Status.Should().Be(MembershipStatus.Active);
    }

    //  GET api/Membership/{id}

    [Fact]
    public async Task GetMembershipById_NotExists_Returns404()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId);

        var response = await _client.GetAsync($"/api/Membership/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    //  GET api/Membership/user/{userId}/status 

    [Fact]
    public async Task GetUserMembershipStatus_NoMembership_Returns404()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId, "Receptionist");

        var response = await _client.GetAsync($"/api/Membership/user/{Guid.NewGuid()}/status");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    //  Admin endpoints 

    [Fact]
    public async Task GetExpiringMemberships_AsAdmin_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId, "Admin");

        var response = await _client.GetAsync("/api/Membership/admin/expiring?days=30");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetExpiringMemberships_AsMember_ReturnsForbidden()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId, "Member");

        var response = await _client.GetAsync("/api/Membership/admin/expiring?days=30");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetMembershipsByStatus_AsAdmin_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId, "Admin");

        var response = await _client.GetAsync("/api/Membership/admin/status/Active");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetMembershipsByStatus_InvalidStatus_ReturnsBadRequest()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId, "Admin");

        var response = await _client.GetAsync("/api/Membership/admin/status/InvalidStatus");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // DELETE api/Membership/{id} 

    [Fact]
    public async Task DeleteMembership_NotExists_Returns404()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId);

        var response = await _client.DeleteAsync($"/api/Membership/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    //Full CRUD flow with Auth

    [Fact]
    public async Task FullMembershipFlow_CreateReadDelete()
    {
        var userId = Guid.NewGuid();
        var packageId = SeedPackageAndGetId();
        SetAuthHeader(userId);

        // Create
        var createDto = new CreateMembershipDto
        {
            PackageId = packageId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = MembershipStatus.Active
        };
        var content = new StringContent(JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json");
        var createResponse = await _client.PostAsync("/api/Membership", content);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<MembershipDto>(_jsonOptions);

        //  Read by ID
        var getResponse = await _client.GetAsync($"/api/Membership/{created!.MembershipId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var fetched = await getResponse.Content.ReadFromJsonAsync<MembershipDto>(_jsonOptions);
        fetched!.MembershipId.Should().Be(created.MembershipId);

        //  Check user status (as Receptionist)
        SetAuthHeader(userId, "Receptionist");
        var statusResponse = await _client.GetAsync($"/api/Membership/user/{userId}/status");
        statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        //  Delete
        SetAuthHeader(userId);
        var deleteResponse = await _client.DeleteAsync($"/api/Membership/{created.MembershipId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        //  Verify deleted
        var afterDelete = await _client.GetAsync($"/api/Membership/{created.MembershipId}");
        afterDelete.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // Receptionist checkin/manual 

    [Fact]
    public async Task RecordManualCheckin_AsReceptionist_WithActiveMembership_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        var packageId = SeedPackageAndGetId();
        
        // Create membership first (as member)
        SetAuthHeader(userId);
        var createDto = new CreateMembershipDto
        {
            PackageId = packageId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = MembershipStatus.Active
        };
        var content = new StringContent(JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json");
        var createResponse = await _client.PostAsync("/api/Membership", content);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Record manual check-in (as Receptionist)
        SetAuthHeader(Guid.NewGuid(), "Receptionist");
        var checkinDto = new ManualCheckinDto
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow,
            Location = "Front Desk"
        };
        var checkinContent = new StringContent(JsonSerializer.Serialize(checkinDto), Encoding.UTF8, "application/json");
        
        var response = await _client.PostAsync("/api/Membership/checkin/manual", checkinContent);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RecordManualCheckin_AsMember_ReturnsForbidden()
    {
        var userId = Guid.NewGuid();
        SetAuthHeader(userId, "Member");

        var checkinDto = new ManualCheckinDto
        {
            UserId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Location = "Front Desk"
        };
        var content = new StringContent(JsonSerializer.Serialize(checkinDto), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/Membership/checkin/manual", content);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}

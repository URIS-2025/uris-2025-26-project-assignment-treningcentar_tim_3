using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using MembershipService.Context;
using MembershipService.Models;
using MembershipService.Models.DTO;
using MembershipService.Models.Enums;
using Microsoft.Extensions.DependencyInjection;
using FluentAssertions;
using Xunit;

namespace MembershipService.Tests.IntegrationTests;

/// Integration tests for Checkin endpoints (api/checkins).
public class CheckinIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public CheckinIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private (Guid userId, Guid membershipId) SeedActiveMembership()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MembershipContext>();
        
        var package = new Package
        {
            PackageId = Guid.NewGuid(),
            Name = "Test Package",
            Description = "Test",
            Price = 29.99,
            Duration = 30,
            Services = new List<string> { "Gym" }
        };
        context.Packages.Add(package);

        var userId = Guid.NewGuid();
        var membership = new Membership
        {
            MembershipId = Guid.NewGuid(),
            UserId = userId,
            PackageId = package.PackageId,
            StartDate = DateTime.UtcNow.AddDays(-5),
            EndDate = DateTime.UtcNow.AddDays(25),
            CreatedDate = DateTime.UtcNow,
            Status = MembershipStatus.Active
        };
        context.Memberships.Add(membership);
        context.SaveChanges();

        return (userId, membership.MembershipId);
    }

    //  POST api/checkins 

    [Fact]
    public async Task RecordCheckin_ActiveMembership_ReturnsOk()
    {
        var (userId, _) = SeedActiveMembership();
        var dto = new RecordCheckinDto
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow,
            Location = "Main Entrance"
        };
        var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/checkins", content);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RecordCheckin_NoMembership_ReturnsConflict()
    {
        var dto = new RecordCheckinDto
        {
            UserId = Guid.NewGuid(), // No membership exists
            Timestamp = DateTime.UtcNow,
            Location = "Main Entrance"
        };
        var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/checkins", content);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    // GET api/checkins/{userId}/history

    [Fact]
    public async Task GetCheckinHistory_NoCheckins_ReturnsOkWithEmpty()
    {
        var userId = Guid.NewGuid();

        var response = await _client.GetAsync($"/api/checkins/{userId}/history");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var history = await response.Content.ReadFromJsonAsync<List<CheckinDto>>(_jsonOptions);
        history.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCheckinHistory_AfterCheckin_ReturnsCheckin()
    {
        var (userId, _) = SeedActiveMembership();
        // Record a check-in first
        var checkinDto = new RecordCheckinDto
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow.AddDays(-1),
            Location = "Side Entrance"
        };
        var checkinContent = new StringContent(JsonSerializer.Serialize(checkinDto), Encoding.UTF8, "application/json");
        await _client.PostAsync("/api/checkins", checkinContent);

        // Now get history
        var response = await _client.GetAsync($"/api/checkins/{userId}/history");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var history = await response.Content.ReadFromJsonAsync<List<CheckinDto>>(_jsonOptions);
        history.Should().NotBeEmpty();
        history!.First().Location.Should().Be("Side Entrance");
    }

    // GET api/checkins/{userId}/can-checkin

    [Fact]
    public async Task CanCheckinToday_NoPreviousCheckin_ReturnsTrue()
    {
        var userId = Guid.NewGuid();

        var response = await _client.GetAsync($"/api/checkins/{userId}/can-checkin");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var canCheckin = await response.Content.ReadFromJsonAsync<bool>();
        canCheckin.Should().BeTrue();
    }

    //  GET api/checkins/{userId}/validate-membership

    [Fact]
    public async Task ValidateMembership_ActiveMembership_ReturnsTrue()
    {
        var (userId, _) = SeedActiveMembership();

        var response = await _client.GetAsync($"/api/checkins/{userId}/validate-membership");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var isValid = await response.Content.ReadFromJsonAsync<bool>();
        isValid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateMembership_NoMembership_ReturnsFalse()
    {
        var response = await _client.GetAsync($"/api/checkins/{Guid.NewGuid()}/validate-membership");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var isValid = await response.Content.ReadFromJsonAsync<bool>();
        isValid.Should().BeFalse();
    }

    // Full check-in flow 

    [Fact]
    public async Task FullCheckinFlow_ValidateThenCheckinThenHistory()
    {
        var (userId, _) = SeedActiveMembership();

        //  Validate membership
        var validateResponse = await _client.GetAsync($"/api/checkins/{userId}/validate-membership");
        validateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var isValid = await validateResponse.Content.ReadFromJsonAsync<bool>();
        isValid.Should().BeTrue();

        //  Check can check-in
        var canCheckinResponse = await _client.GetAsync($"/api/checkins/{userId}/can-checkin");
        var canCheckin = await canCheckinResponse.Content.ReadFromJsonAsync<bool>();
        canCheckin.Should().BeTrue();

        //  Record check-in
        var checkinDto = new RecordCheckinDto
        {
            UserId = userId,
            Timestamp = DateTime.UtcNow.AddHours(-2), // Avoid date collision with other tests
            Location = "Front Desk"
        };
        var content = new StringContent(JsonSerializer.Serialize(checkinDto), Encoding.UTF8, "application/json");
        var checkinResponse = await _client.PostAsync("/api/checkins", content);
        checkinResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        //  Verify in history
        var historyResponse = await _client.GetAsync($"/api/checkins/{userId}/history");
        var history = await historyResponse.Content.ReadFromJsonAsync<List<CheckinDto>>(_jsonOptions);
        history.Should().NotBeEmpty();
        history!.Should().Contain(c => c.Location == "Front Desk");
    }
}

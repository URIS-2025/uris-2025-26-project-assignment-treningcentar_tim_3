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


/// Integration tests for Package endpoints (api/packages).
public class PackageIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public PackageIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void SeedPackage(string name = "Basic", double price = 29.99, int duration = 30)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MembershipContext>();
        context.Packages.Add(new Package
        {
            PackageId = Guid.NewGuid(),
            Name = name,
            Description = $"{name} package",
            Price = price,
            Duration = duration,
            Services = new List<string> { "Gym Access" }
        });
        context.SaveChanges();
    }

    // GET api/packages

    [Fact]
    public async Task GetAllPackages_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/packages");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var packages = await response.Content.ReadFromJsonAsync<List<PackageDto>>(_jsonOptions);
        packages.Should().NotBeNull();
    }

    // POST api/packages 

    [Fact]
    public async Task CreatePackage_ValidDto_ReturnsCreated()
    {
        var dto = new CreatePackageDto
        {
            Name = "Integration Test Package",
            Description = "Created via integration test",
            Price = 45.00,
            Duration = 30,
            Services = new List<string> { "Gym", "Pool" }
        };
        var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/packages", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<PackageDto>(_jsonOptions);
        created.Should().NotBeNull();
        created!.Name.Should().Be("Integration Test Package");
        created.Price.Should().Be(45.00);
    }

    [Fact]
    public async Task CreatePackage_MissingName_ReturnsBadRequest()
    {
        var dto = new { Description = "No name", Price = 10.0, Duration = 30 };
        var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/packages", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    //  GET api/packages/{id} 

    [Fact]
    public async Task GetPackageById_NotFound_Returns404()
    {
        var response = await _client.GetAsync($"/api/packages/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // GET api/packages/{id}/validate 

    [Fact]
    public async Task ValidatePackage_NonExistent_ReturnsFalse()
    {
        var response = await _client.GetAsync($"/api/packages/{Guid.NewGuid()}/validate");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<bool>();
        result.Should().BeFalse();
    }

    // DELETE api/packages/{id} 

    [Fact]
    public async Task DeletePackage_NonExistent_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/packages/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    //  Full CRUD flow

    [Fact]
    public async Task FullCrudFlow_CreateReadUpdateDelete()
    {
        // Create
        var createDto = new CreatePackageDto
        {
            Name = "CRUD Test",
            Description = "Full flow",
            Price = 100.00,
            Duration = 60,
            Services = new List<string> { "All Access" }
        };
        var createContent = new StringContent(JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json");
        var createResponse = await _client.PostAsync("/api/packages", createContent);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<PackageDto>(_jsonOptions);

        // Read
        var getResponse = await _client.GetAsync($"/api/packages/{created!.PackageId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var fetched = await getResponse.Content.ReadFromJsonAsync<PackageDto>(_jsonOptions);
        fetched!.Name.Should().Be("CRUD Test");

        // Update
        var updateDto = new CreatePackageDto
        {
            Name = "CRUD Updated",
            Description = "Updated",
            Price = 150.00,
            Duration = 90,
            Services = new List<string> { "All Access", "VIP" }
        };
        var updateContent = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");
        var updateResponse = await _client.PutAsync($"/api/packages/{created.PackageId}", updateContent);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await updateResponse.Content.ReadFromJsonAsync<PackageDto>(_jsonOptions);
        updated!.Name.Should().Be("CRUD Updated");
        updated.Price.Should().Be(150.00);

        // Validate
        var validateResponse = await _client.GetAsync($"/api/packages/{created.PackageId}/validate");
        validateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var isValid = await validateResponse.Content.ReadFromJsonAsync<bool>();
        isValid.Should().BeTrue();

        // Delete
        var deleteResponse = await _client.DeleteAsync($"/api/packages/{created.PackageId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify deleted
        var afterDelete = await _client.GetAsync($"/api/packages/{created.PackageId}");
        afterDelete.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

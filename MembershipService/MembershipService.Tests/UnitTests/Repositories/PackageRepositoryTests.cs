using MembershipService.Data;
using MembershipService.Tests.Helpers;
using FluentAssertions;
using Xunit;

namespace MembershipService.Tests.UnitTests.Repositories;


/// Unit tests for PackageRepository using InMemory EF Core database.
public class PackageRepositoryTests : IDisposable
{
    private readonly MembershipService.Context.MembershipContext _context;
    private readonly PackageRepository _repository;

    public PackageRepositoryTests()
    {
        _context = TestHelpers.CreateInMemoryContext();
        var mapper = TestHelpers.CreateMapper();
        _repository = new PackageRepository(_context, mapper);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // GetAllPackages

    [Fact]
    public void GetAllPackages_EmptyDb_ReturnsEmpty()
    {
        var result = _repository.GetAllPackages();

        result.Should().BeEmpty();
    }

    [Fact]
    public void GetAllPackages_WithData_ReturnsAll()
    {
        TestHelpers.SeedPackage(_context, "Basic", 29.99, 30);
        TestHelpers.SeedPackage(_context, "Premium", 59.99, 30);

        var result = _repository.GetAllPackages();

        result.Should().HaveCount(2);
    }

    // GetPackageById

    [Fact]
    public void GetPackageById_Exists_ReturnsPackage()
    {
        var package = TestHelpers.SeedPackage(_context, "Basic");

        var result = _repository.GetPackageById(package.PackageId);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Basic");
    }

    [Fact]
    public void GetPackageById_NotExists_ReturnsNull()
    {
        var result = _repository.GetPackageById(Guid.NewGuid());

        result.Should().BeNull();
    }

    // ValidatePackage

    [Fact]
    public void ValidatePackage_Exists_ReturnsTrue()
    {
        var package = TestHelpers.SeedPackage(_context);

        var result = _repository.ValidatePackage(package.PackageId);

        result.Should().BeTrue();
    }

    [Fact]
    public void ValidatePackage_NotExists_ReturnsFalse()
    {
        var result = _repository.ValidatePackage(Guid.NewGuid());

        result.Should().BeFalse();
    }

    //CreatePackage 

    [Fact]
    public void CreatePackage_ValidDto_CreatesAndReturns()
    {
        var dto = new MembershipService.Models.DTO.CreatePackageDto
        {
            Name = "Gold",
            Description = "Gold membership",
            Price = 99.99,
            Duration = 90,
            Services = new List<string> { "Gym", "Pool", "Sauna" }
        };

        var result = _repository.CreatePackage(dto);

        result.Should().NotBeNull();
        result.Name.Should().Be("Gold");
        result.Price.Should().Be(99.99);
        result.Duration.Should().Be(90);
        _context.Packages.Should().HaveCount(1);
    }

    [Fact]
    public void CreatePackage_InvalidDuration_ThrowsException()
    {
        var dto = new MembershipService.Models.DTO.CreatePackageDto
        {
            Name = "Bad",
            Description = "Invalid",
            Price = 10,
            Duration = 0
        };

        var act = () => _repository.CreatePackage(dto);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Package duration must be greater than 0.");
    }

    // UpdatePackage 

    [Fact]
    public void UpdatePackage_Exists_UpdatesFields()
    {
        var package = TestHelpers.SeedPackage(_context, "Old Name", 10, 30);
        var dto = new MembershipService.Models.DTO.CreatePackageDto
        {
            Name = "New Name",
            Description = "Updated",
            Price = 50,
            Duration = 60,
            Services = new List<string> { "Gym" }
        };

        var result = _repository.UpdatePackage(package.PackageId, dto);

        result.Should().NotBeNull();
        result!.Name.Should().Be("New Name");
        result.Price.Should().Be(50);
        result.Duration.Should().Be(60);
    }

    [Fact]
    public void UpdatePackage_NotExists_ReturnsNull()
    {
        var dto = new MembershipService.Models.DTO.CreatePackageDto
        {
            Name = "X", Description = "X", Price = 10, Duration = 30
        };

        var result = _repository.UpdatePackage(Guid.NewGuid(), dto);

        result.Should().BeNull();
    }

    [Fact]
    public void UpdatePackage_InvalidDuration_ThrowsException()
    {
        var package = TestHelpers.SeedPackage(_context);
        var dto = new MembershipService.Models.DTO.CreatePackageDto
        {
            Name = "X", Description = "X", Price = 10, Duration = -1
        };

        var act = () => _repository.UpdatePackage(package.PackageId, dto);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Package duration must be greater than 0.");
    }

    //  DeletePackage 
    [Fact]
    public void DeletePackage_Exists_ReturnsTrue()
    {
        var package = TestHelpers.SeedPackage(_context);

        var result = _repository.DeletePackage(package.PackageId);

        result.Should().BeTrue();
        _context.Packages.Should().BeEmpty();
    }

    [Fact]
    public void DeletePackage_NotExists_ReturnsFalse()
    {
        var result = _repository.DeletePackage(Guid.NewGuid());

        result.Should().BeFalse();
    }

    [Fact]
    public void DeletePackage_HasActiveMemberships_ThrowsException()
    {
        var package = TestHelpers.SeedPackage(_context);
        TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId, MembershipService.Models.Enums.MembershipStatus.Active);

        var act = () => _repository.DeletePackage(package.PackageId);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot delete package with active memberships.");
    }
}

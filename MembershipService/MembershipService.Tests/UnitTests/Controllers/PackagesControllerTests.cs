using MembershipService.Controllers;
using MembershipService.Data;
using MembershipService.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;
using Xunit;

namespace MembershipService.Tests.UnitTests.Controllers;


/// Unit tests for PackagesController using mocked IPackageRepository.
public class PackagesControllerTests
{
    private readonly Mock<IPackageRepository> _mockRepo;
    private readonly PackagesController _controller;

    public PackagesControllerTests()
    {
        _mockRepo = new Mock<IPackageRepository>();
        _controller = new PackagesController(_mockRepo.Object);
    }

    // GET api/packages 

    [Fact]
    public void GetAllPackages_ReturnsOkWithList()
    {
        var packages = new List<PackageDto>
        {
            new PackageDto { PackageId = Guid.NewGuid(), Name = "Basic", Price = 29.99 },
            new PackageDto { PackageId = Guid.NewGuid(), Name = "Premium", Price = 59.99 }
        };
        _mockRepo.Setup(r => r.GetAllPackages()).Returns(packages);

        var result = _controller.GetAllPackages();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeAssignableTo<IEnumerable<PackageDto>>().Subject;
        returned.Should().HaveCount(2);
    }

    [Fact]
    public void GetAllPackages_Empty_ReturnsOkWithEmptyList()
    {
        _mockRepo.Setup(r => r.GetAllPackages()).Returns(new List<PackageDto>());

        var result = _controller.GetAllPackages();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeAssignableTo<IEnumerable<PackageDto>>().Subject;
        returned.Should().BeEmpty();
    }

    // GET api/packages/{id} 

    [Fact]
    public void GetPackageById_Exists_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var package = new PackageDto { PackageId = id, Name = "Basic" };
        _mockRepo.Setup(r => r.GetPackageById(id)).Returns(package);

        var result = _controller.GetPackageById(id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeOfType<PackageDto>().Subject;
        returned.Name.Should().Be("Basic");
    }

    [Fact]
    public void GetPackageById_NotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetPackageById(id)).Returns((PackageDto?)null);

        var result = _controller.GetPackageById(id);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    // GET api/packages/{id}/validate

    [Fact]
    public void ValidatePackage_Exists_ReturnsTrue()
    {
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.ValidatePackage(id)).Returns(true);

        var result = _controller.ValidatePackage(id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(true);
    }

    [Fact]
    public void ValidatePackage_NotExists_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.ValidatePackage(id)).Returns(false);

        var result = _controller.ValidatePackage(id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(false);
    }

    //  POST api/packages 

    [Fact]
    public void CreatePackage_ValidDto_ReturnsCreatedAtAction()
    {
        var dto = new CreatePackageDto
        {
            Name = "New Package",
            Description = "Test package",
            Price = 39.99,
            Duration = 30,
            Services = new List<string> { "Gym", "Pool" }
        };
        var created = new PackageDto
        {
            PackageId = Guid.NewGuid(),
            Name = dto.Name,
            Price = dto.Price
        };
        _mockRepo.Setup(r => r.CreatePackage(dto)).Returns(created);

        var result = _controller.CreatePackage(dto);

        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);
    }

    [Fact]
    public void CreatePackage_InvalidDuration_ReturnsBadRequest()
    {
        var dto = new CreatePackageDto
        {
            Name = "Bad Package",
            Description = "Invalid",
            Price = 10,
            Duration = 0, // Invalid
            Services = new List<string>()
        };
        _mockRepo.Setup(r => r.CreatePackage(dto))
            .Throws(new InvalidOperationException("Package duration must be greater than 0."));

        var result = _controller.CreatePackage(dto);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // PUT api/packages/{id}

    [Fact]
    public void UpdatePackage_Exists_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var dto = new CreatePackageDto
        {
            Name = "Updated",
            Description = "Updated desc",
            Price = 49.99,
            Duration = 60,
            Services = new List<string> { "Gym" }
        };
        var updated = new PackageDto { PackageId = id, Name = "Updated", Price = 49.99 };
        _mockRepo.Setup(r => r.UpdatePackage(id, dto)).Returns(updated);

        var result = _controller.UpdatePackage(id, dto);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeOfType<PackageDto>().Subject;
        returned.Name.Should().Be("Updated");
    }

    [Fact]
    public void UpdatePackage_NotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var dto = new CreatePackageDto
        {
            Name = "Updated",
            Description = "Desc",
            Price = 49.99,
            Duration = 60
        };
        _mockRepo.Setup(r => r.UpdatePackage(id, dto)).Returns((PackageDto?)null);

        var result = _controller.UpdatePackage(id, dto);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    //  DELETE api/packages/{id} 

    [Fact]
    public void DeletePackage_Exists_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.DeletePackage(id)).Returns(true);

        var result = _controller.DeletePackage(id);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public void DeletePackage_NotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.DeletePackage(id)).Returns(false);

        var result = _controller.DeletePackage(id);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public void DeletePackage_HasActiveMemberships_ReturnsConflict()
    {
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.DeletePackage(id))
            .Throws(new InvalidOperationException("Cannot delete package with active memberships."));

        var result = _controller.DeletePackage(id);

        result.Should().BeOfType<ConflictObjectResult>();
    }
}

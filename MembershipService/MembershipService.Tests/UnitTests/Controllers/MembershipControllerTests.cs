using AutoMapper;
using MembershipService.Controllers;
using MembershipService.Data;
using MembershipService.Models.DTO;
using MembershipService.Models.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;
using System.Security.Claims;
using Xunit;

namespace MembershipService.Tests.UnitTests.Controllers;


/// Unit tests for MembershipController using mocked dependencies.
public class MembershipControllerTests
{
    private readonly Mock<IMembershipRepository> _mockRepo;
    private readonly Mock<ICheckinRepository> _mockCheckinRepo;
    private readonly Mock<IPackageRepository> _mockPackageRepo;
    private readonly Mock<IMapper> _mockMapper;
    private readonly MembershipController _controller;

    public MembershipControllerTests()
    {
        _mockRepo = new Mock<IMembershipRepository>();
        _mockCheckinRepo = new Mock<ICheckinRepository>();
        _mockPackageRepo = new Mock<IPackageRepository>();
        _mockMapper = new Mock<IMapper>();
        _controller = new MembershipController(_mockRepo.Object, _mockCheckinRepo.Object, _mockPackageRepo.Object, _mockMapper.Object);

        // Setup default authenticated user
        var userId = Guid.NewGuid();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, "Member")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

// GET api/membership

    [Fact]
    public void GetMemberships_ReturnsOkWithList()
    {
        var memberships = new List<MembershipDto>
        {
            new MembershipDto { MembershipId = Guid.NewGuid(), Status = MembershipStatus.Active },
            new MembershipDto { MembershipId = Guid.NewGuid(), Status = MembershipStatus.Expired }
        };
        _mockRepo.Setup(r => r.GetMemberships()).Returns(memberships);

        var result = _controller.GetMemberships();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedList = okResult.Value.Should().BeAssignableTo<IEnumerable<MembershipDto>>().Subject;
        returnedList.Should().HaveCount(2);
    }

    [Fact]
    public void GetMemberships_EmptyList_ReturnsOkWithEmpty()
    {
        _mockRepo.Setup(r => r.GetMemberships()).Returns(new List<MembershipDto>());

        var result = _controller.GetMemberships();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedList = okResult.Value.Should().BeAssignableTo<IEnumerable<MembershipDto>>().Subject;
        returnedList.Should().BeEmpty();
    }

    // GET api/membership/{id}

    [Fact]
    public void GetMembershipById_Exists_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var membership = new MembershipDto { MembershipId = id, Status = MembershipStatus.Active };
        _mockRepo.Setup(r => r.GetMembershipById(id)).Returns(membership);

        var result = _controller.GetMembershipById(id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeOfType<MembershipDto>().Subject;
        returned.MembershipId.Should().Be(id);
    }

    [Fact]
    public void GetMembershipById_NotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetMembershipById(id)).Returns((MembershipDto?)null);

        var result = _controller.GetMembershipById(id);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    // POST api/membership

    [Fact]
    public void CreateMembership_ValidDto_ReturnsCreatedAtAction()
    {
        var dto = new CreateMembershipDto
        {
            PackageId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = MembershipStatus.Active
        };
        var created = new MembershipDto
        {
            MembershipId = Guid.NewGuid(),
            PackageId = dto.PackageId,
            Status = MembershipStatus.Active
        };
        _mockRepo.Setup(r => r.CreateMembership(It.IsAny<CreateMembershipDto>())).Returns(created);

        var result = _controller.CreateMembership(dto);

        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);
        var returned = createdResult.Value.Should().BeOfType<MembershipDto>().Subject;
        returned.MembershipId.Should().Be(created.MembershipId);
    }

    // PUT api/membership/{id} 

    [Fact]
    public void UpdateMembership_Exists_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var dto = new CreateMembershipDto
        {
            PackageId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(60),
            Status = MembershipStatus.Active
        };
        var updated = new MembershipDto { MembershipId = id, Status = MembershipStatus.Active };
        _mockRepo.Setup(r => r.UpdateMembership(id, It.IsAny<CreateMembershipDto>())).Returns(updated);

        var result = _controller.UpdateMembership(id, dto);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeOfType<MembershipDto>().Subject;
        returned.MembershipId.Should().Be(id);
    }

    [Fact]
    public void UpdateMembership_NotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var dto = new CreateMembershipDto
        {
            PackageId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(60),
            Status = MembershipStatus.Active
        };
        _mockRepo.Setup(r => r.UpdateMembership(id, It.IsAny<CreateMembershipDto>())).Returns((MembershipDto?)null);

        var result = _controller.UpdateMembership(id, dto);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    // DELETE api/membership/{id}

    [Fact]
    public void DeleteMembership_Exists_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        var membership = new MembershipDto { MembershipId = id };
        _mockRepo.Setup(r => r.GetMembershipById(id)).Returns(membership);

        var result = _controller.DeleteMembership(id);

        result.Should().BeOfType<NoContentResult>();
        _mockRepo.Verify(r => r.DeleteMembership(id), Times.Once);
    }

    [Fact]
    public void DeleteMembership_NotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetMembershipById(id)).Returns((MembershipDto?)null);

        var result = _controller.DeleteMembership(id);

        result.Should().BeOfType<NotFoundResult>();
        _mockRepo.Verify(r => r.DeleteMembership(id), Times.Never);
    }

    // GET api/membership/user/{userId}/status 

    [Fact]
    public void GetUserMembershipStatus_HasMembership_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        var membership = new MembershipDto { MembershipId = Guid.NewGuid(), UserId = userId, Status = MembershipStatus.Active };
        _mockRepo.Setup(r => r.GetUserMembership(userId)).Returns(membership);

        var result = _controller.GetUserMembershipStatus(userId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeOfType<MembershipDto>().Subject;
        returned.UserId.Should().Be(userId);
    }

    [Fact]
    public void GetUserMembershipStatus_NoMembership_ReturnsNotFound()
    {
        var userId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetUserMembership(userId)).Returns((MembershipDto?)null);

        var result = _controller.GetUserMembershipStatus(userId);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    // POST api/membership/checkin/manual 

    [Fact]
    public void RecordManualCheckin_Success_ReturnsOk()
    {
        var dto = new ManualCheckinDto
        {
            UserId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Location = "Main Entrance"
        };
        _mockCheckinRepo.Setup(r => r.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location));

        var result = _controller.RecordManualCheckin(dto);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be("Check-in recorded successfully");
    }

    [Fact]
    public void RecordManualCheckin_InvalidOperation_ReturnsBadRequest()
    {
        var dto = new ManualCheckinDto
        {
            UserId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Location = "Main Entrance"
        };
        _mockCheckinRepo.Setup(r => r.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location))
            .Throws(new InvalidOperationException("User does not have an active membership."));

        var result = _controller.RecordManualCheckin(dto);

        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequest.Value.Should().Be("User does not have an active membership.");
    }
}

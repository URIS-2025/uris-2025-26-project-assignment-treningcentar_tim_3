using MembershipService.Controllers;
using MembershipService.Data;
using MembershipService.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Moq;
using FluentAssertions;
using Xunit;

namespace MembershipService.Tests.UnitTests.Controllers;


/// Unit tests for CheckinsController using mocked ICheckinRepository.
public class CheckinsControllerTests
{
    private readonly Mock<ICheckinRepository> _mockRepo;
    private readonly CheckinsController _controller;

    public CheckinsControllerTests()
    {
        _mockRepo = new Mock<ICheckinRepository>();
        _controller = new CheckinsController(_mockRepo.Object);
    }

    // POST api/checkins 

    [Fact]
    public void RecordCheckin_ValidDto_ReturnsOk()
    {
        var dto = new RecordCheckinDto
        {
            UserId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Location = "Main Entrance"
        };
        _mockRepo.Setup(r => r.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location));

        var result = _controller.RecordCheckin(dto);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be("Check-in recorded successfully.");
    }

    [Fact]
    public void RecordCheckin_NoActiveMembership_ReturnsConflict()
    {
        var dto = new RecordCheckinDto
        {
            UserId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Location = "Main Entrance"
        };
        _mockRepo.Setup(r => r.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location))
            .Throws(new InvalidOperationException("User does not have an active membership."));

        var result = _controller.RecordCheckin(dto);

        var conflict = result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflict.Value.Should().Be("User does not have an active membership.");
    }

    [Fact]
    public void RecordCheckin_DuplicateCheckin_ReturnsConflict()
    {
        var dto = new RecordCheckinDto
        {
            UserId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Location = "Main Entrance"
        };
        _mockRepo.Setup(r => r.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location))
            .Throws(new InvalidOperationException("User has already checked in today."));

        var result = _controller.RecordCheckin(dto);

        var conflict = result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflict.Value.Should().Be("User has already checked in today.");
    }

    //  GET api/checkins/{userId}/history 

    [Fact]
    public void GetCheckinHistory_WithHistory_ReturnsOkWithList()
    {
        var userId = Guid.NewGuid();
        var history = new List<CheckinDto>
        {
            new CheckinDto { CheckinId = Guid.NewGuid(), UserId = userId, Timestamp = DateTime.UtcNow.AddDays(-1) },
            new CheckinDto { CheckinId = Guid.NewGuid(), UserId = userId, Timestamp = DateTime.UtcNow.AddDays(-2) }
        };
        _mockRepo.Setup(r => r.GetCheckinHistory(userId, null, null)).Returns(history);

        var result = _controller.GetCheckinHistory(userId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeAssignableTo<IEnumerable<CheckinDto>>().Subject;
        returned.Should().HaveCount(2);
    }

    [Fact]
    public void GetCheckinHistory_NoHistory_ReturnsOkWithEmpty()
    {
        var userId = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetCheckinHistory(userId, null, null)).Returns(new List<CheckinDto>());

        var result = _controller.GetCheckinHistory(userId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returned = okResult.Value.Should().BeAssignableTo<IEnumerable<CheckinDto>>().Subject;
        returned.Should().BeEmpty();
    }

    [Fact]
    public void GetCheckinHistory_WithDateFilters_PassesParametersCorrectly()
    {
        var userId = Guid.NewGuid();
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        _mockRepo.Setup(r => r.GetCheckinHistory(userId, startDate, endDate)).Returns(new List<CheckinDto>());

        var result = _controller.GetCheckinHistory(userId, startDate, endDate);

        _mockRepo.Verify(r => r.GetCheckinHistory(userId, startDate, endDate), Times.Once);
    }

    //  GET api/checkins/{userId}/can-checkin 

    [Fact]
    public void CanCheckinToday_NoDuplicateToday_ReturnsTrue()
    {
        var userId = Guid.NewGuid();
        _mockRepo.Setup(r => r.PreventDuplicateCheckinSameDay(userId)).Returns(true);

        var result = _controller.CanCheckinToday(userId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(true);
    }

    [Fact]
    public void CanCheckinToday_AlreadyCheckedIn_ReturnsFalse()
    {
        var userId = Guid.NewGuid();
        _mockRepo.Setup(r => r.PreventDuplicateCheckinSameDay(userId)).Returns(false);

        var result = _controller.CanCheckinToday(userId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(false);
    }

    //  GET api/checkins/{userId}/validate-membership 

    [Fact]
    public void ValidateMembershipForCheckin_ActiveMembership_ReturnsTrue()
    {
        var userId = Guid.NewGuid();
        _mockRepo.Setup(r => r.ValidateMembershipForCheckin(userId)).Returns(true);

        var result = _controller.ValidateMembershipForCheckin(userId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(true);
    }

    [Fact]
    public void ValidateMembershipForCheckin_NoMembership_ReturnsFalse()
    {
        var userId = Guid.NewGuid();
        _mockRepo.Setup(r => r.ValidateMembershipForCheckin(userId)).Returns(false);

        var result = _controller.ValidateMembershipForCheckin(userId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(false);
    }

    // POST api/checkins/manual 

    [Fact]
    public void RecordManualCheckin_Success_ReturnsOk()
    {
        var dto = new RecordCheckinDto
        {
            UserId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Location = "Side Entrance"
        };
        _mockRepo.Setup(r => r.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location));

        var result = _controller.RecordManualCheckin(dto);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be("Check-in recorded successfully.");
    }

    [Fact]
    public void RecordManualCheckin_Conflict_ReturnsConflict()
    {
        var dto = new RecordCheckinDto
        {
            UserId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Location = "Side Entrance"
        };
        _mockRepo.Setup(r => r.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location))
            .Throws(new InvalidOperationException("User has already checked in today."));

        var result = _controller.RecordManualCheckin(dto);

        var conflict = result.Should().BeOfType<ConflictObjectResult>().Subject;
        conflict.Value.Should().Be("User has already checked in today.");
    }
}

using MembershipService.Data;
using MembershipService.Models.Enums;
using MembershipService.Tests.Helpers;
using FluentAssertions;
using Xunit;


namespace MembershipService.Tests.UnitTests.Repositories;


/// Unit tests for CheckinRepository using InMemory EF Core database.
public class CheckinRepositoryTests : IDisposable
{
    private readonly MembershipService.Context.MembershipContext _context;
    private readonly CheckinRepository _repository;

    public CheckinRepositoryTests()
    {
        _context = TestHelpers.CreateInMemoryContext();
        var mapper = TestHelpers.CreateMapper();
        var loggerService = TestHelpers.CreateMockLoggerService();
        _repository = new CheckinRepository(_context, mapper, loggerService.Object);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // RecordCheckin 

    [Fact]
    public void RecordCheckin_ActiveMembership_RecordsSuccessfully()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        TestHelpers.SeedMembership(_context, userId, package.PackageId);

        _repository.RecordCheckin(userId, DateTime.UtcNow, "Main Entrance");

        _context.Checkins.Should().HaveCount(1);
        _context.Checkins.First().Location.Should().Be("Main Entrance");
    }

    [Fact]
    public void RecordCheckin_NoActiveMembership_ThrowsException()
    {
        var userId = Guid.NewGuid();

        var act = () => _repository.RecordCheckin(userId, DateTime.UtcNow, "Main Entrance");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("User does not have an active membership.");
    }

    [Fact]
    public void RecordCheckin_CancelledMembership_ThrowsException()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        TestHelpers.SeedMembership(_context, userId, package.PackageId, MembershipStatus.Cancelled);

        var act = () => _repository.RecordCheckin(userId, DateTime.UtcNow, "Main Entrance");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("User does not have an active membership.");
    }

    [Fact]
    public void RecordCheckin_DuplicateSameDay_ThrowsException()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId);
        // First check-in today
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow);

        var act = () => _repository.RecordCheckin(userId, DateTime.UtcNow, "Main Entrance");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("User has already checked in today.");
    }

    [Fact]
    public void RecordCheckin_DifferentDay_Succeeds()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId);
        // Check-in yesterday
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-1));

        _repository.RecordCheckin(userId, DateTime.UtcNow, "Main Entrance");

        _context.Checkins.Should().HaveCount(2);
    }

    //  GetCheckinHistory 

    [Fact]
    public void GetCheckinHistory_WithCheckins_ReturnsOrdered()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId);
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-3));
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-1));
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-5));

        var result = _repository.GetCheckinHistory(userId);

        result.Should().HaveCount(3);
        result.First().Timestamp.Should().BeAfter(result.Last().Timestamp);
    }

    [Fact]
    public void GetCheckinHistory_NoCheckins_ReturnsEmpty()
    {
        var userId = Guid.NewGuid();

        var result = _repository.GetCheckinHistory(userId);

        result.Should().BeEmpty();
    }

    [Fact]
    public void GetCheckinHistory_WithDateFilter_FiltersCorrectly()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId);
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-10));
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-3));
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-1));

        var result = _repository.GetCheckinHistory(userId, DateTime.UtcNow.AddDays(-5));

        result.Should().HaveCount(2);
    }

    //  PreventDuplicateCheckinSameDay 

    [Fact]
    public void PreventDuplicateCheckinSameDay_NoCheckinToday_ReturnsTrue()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId);
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-1));

        var result = _repository.PreventDuplicateCheckinSameDay(userId);

        result.Should().BeTrue();
    }

    [Fact]
    public void PreventDuplicateCheckinSameDay_CheckedInToday_ReturnsFalse()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId);
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow);

        var result = _repository.PreventDuplicateCheckinSameDay(userId);

        result.Should().BeFalse();
    }

    // ValidateMembershipForCheckin 

    [Fact]
    public void ValidateMembershipForCheckin_ActiveAndNotExpired_ReturnsTrue()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        TestHelpers.SeedMembership(_context, userId, package.PackageId, daysUntilExpiry: 30);

        var result = _repository.ValidateMembershipForCheckin(userId);

        result.Should().BeTrue();
    }

    [Fact]
    public void ValidateMembershipForCheckin_NoMembership_ReturnsFalse()
    {
        var result = _repository.ValidateMembershipForCheckin(Guid.NewGuid());

        result.Should().BeFalse();
    }

    [Fact]
    public void ValidateMembershipForCheckin_ExpiredMembership_ReturnsFalse()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        TestHelpers.SeedMembership(_context, userId, package.PackageId, daysUntilExpiry: -5);

        var result = _repository.ValidateMembershipForCheckin(userId);

        result.Should().BeFalse();
    }

    //  GetCurrentMonthCheckins 

    [Fact]
    public void GetCurrentMonthCheckins_ReturnsOnlyCurrentMonth()
    {
        var userId = Guid.NewGuid();
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId);
        // This month
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-1));
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddDays(-2));
        // Last month
        TestHelpers.SeedCheckin(_context, membership.MembershipId, DateTime.UtcNow.AddMonths(-1).AddDays(-5));

        var result = _repository.GetCurrentMonthCheckins(userId);

        result.Should().HaveCount(2);
    }
}

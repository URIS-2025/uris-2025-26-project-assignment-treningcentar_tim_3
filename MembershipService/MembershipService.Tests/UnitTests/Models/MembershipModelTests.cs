using MembershipService.Models;
using MembershipService.Models.Enums;
using FluentAssertions;
using Xunit;
namespace MembershipService.Tests.UnitTests.Models;


/// Unit tests for the Membership entity business logic methods.
public class MembershipModelTests
{
    private Membership CreateActiveMembership(int daysUntilExpiry = 30)
    {
        return new Membership
        {
            MembershipId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            PackageId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow.AddDays(-5),
            EndDate = DateTime.UtcNow.AddDays(daysUntilExpiry),
            CreatedDate = DateTime.UtcNow,
            Status = MembershipStatus.Active
        };
    }

    //  IsActive() 

    [Fact]
    public void IsActive_ActiveStatusAndNotExpired_ReturnsTrue()
    {
        var membership = CreateActiveMembership(30);

        membership.IsActive().Should().BeTrue();
    }

    [Fact]
    public void IsActive_ActiveStatusButExpired_ReturnsFalse()
    {
        var membership = CreateActiveMembership(-1);

        membership.IsActive().Should().BeFalse();
    }

    [Fact]
    public void IsActive_CancelledStatus_ReturnsFalse()
    {
        var membership = CreateActiveMembership(30);
        membership.Status = MembershipStatus.Cancelled;

        membership.IsActive().Should().BeFalse();
    }

    [Fact]
    public void IsActive_SuspendedStatus_ReturnsFalse()
    {
        var membership = CreateActiveMembership(30);
        membership.Status = MembershipStatus.Suspended;

        membership.IsActive().Should().BeFalse();
    }

    [Fact]
    public void IsActive_ExpiredStatus_ReturnsFalse()
    {
        var membership = CreateActiveMembership(30);
        membership.Status = MembershipStatus.Expired;

        membership.IsActive().Should().BeFalse();
    }

    //  Renew() 

    [Fact]
    public void Renew_ActiveMembership_ExtendsEndDate()
    {
        var membership = CreateActiveMembership(10);
        var originalEnd = membership.EndDate;

        var result = membership.Renew(30);

        result.Should().BeTrue();
        membership.EndDate.Should().BeCloseTo(originalEnd.AddDays(30), TimeSpan.FromSeconds(1));
        membership.Status.Should().Be(MembershipStatus.Active);
    }

    [Fact]
    public void Renew_CancelledMembership_ReturnsFalse()
    {
        var membership = CreateActiveMembership(10);
        membership.Status = MembershipStatus.Cancelled;

        var result = membership.Renew(30);

        result.Should().BeFalse();
    }

    [Fact]
    public void Renew_ExpiredMembership_ReactivatesAndExtends()
    {
        var membership = CreateActiveMembership(-5);
        membership.Status = MembershipStatus.Expired;
        var originalEnd = membership.EndDate;

        var result = membership.Renew(30);

        result.Should().BeTrue();
        membership.Status.Should().Be(MembershipStatus.Active);
        membership.EndDate.Should().BeCloseTo(originalEnd.AddDays(30), TimeSpan.FromSeconds(1));
    }

    //  Cancel() 

    [Fact]
    public void Cancel_ActiveMembership_SetsCancelledStatus()
    {
        var membership = CreateActiveMembership(30);

        var result = membership.Cancel();

        result.Should().BeTrue();
        membership.Status.Should().Be(MembershipStatus.Cancelled);
        membership.CancelledDate.Should().NotBeNull();
        membership.CancelledDate.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Cancel_AlreadyCancelled_ReturnsFalse()
    {
        var membership = CreateActiveMembership(30);
        membership.Status = MembershipStatus.Cancelled;

        var result = membership.Cancel();

        result.Should().BeFalse();
    }

    //  DaysUntilExpiration() 

    [Fact]
    public void DaysUntilExpiration_FutureDate_ReturnsPositiveDays()
    {
        var membership = CreateActiveMembership(15);

        var days = membership.DaysUntilExpiration();

        days.Should().BeInRange(14, 16);
    }

    [Fact]
    public void DaysUntilExpiration_PastDate_ReturnsZero()
    {
        var membership = CreateActiveMembership(-10);

        var days = membership.DaysUntilExpiration();

        days.Should().Be(0);
    }

    //  CanBeModified() 

    [Fact]
    public void CanBeModified_CancelledMembership_ReturnsFalse()
    {
        var membership = CreateActiveMembership(30);
        membership.Status = MembershipStatus.Cancelled;

        membership.CanBeModified().Should().BeFalse();
    }

    [Fact]
    public void CanBeModified_FutureStartDate_ReturnsTrue()
    {
        var membership = CreateActiveMembership(30);
        membership.StartDate = DateTime.UtcNow.AddDays(5);

        membership.CanBeModified().Should().BeTrue();
    }
}

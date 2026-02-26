using MembershipService.Data;
using MembershipService.Models.Enums;
using MembershipService.Models.DTO;
using MembershipService.Tests.Helpers;
using FluentAssertions;
using Xunit;

namespace MembershipService.Tests.UnitTests.Repositories;


/// Unit tests for MembershipRepository using InMemory EF Core database.
public class MembershipRepositoryTests : IDisposable
{
    private readonly MembershipService.Context.MembershipContext _context;
    private readonly MembershipRepository _repository;

    public MembershipRepositoryTests()
    {
        _context = TestHelpers.CreateInMemoryContext();
        var mapper = TestHelpers.CreateMapper();
        var authService = TestHelpers.CreateMockAuthService(true);
        var loggerService = TestHelpers.CreateMockLoggerService();
        _repository = new MembershipRepository(_context, mapper, authService.Object, loggerService.Object);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    //  GetMemberships 

    [Fact]
    public void GetMemberships_EmptyDb_ReturnsEmpty()
    {
        var result = _repository.GetMemberships();

        result.Should().BeEmpty();
    }

    [Fact]
    public void GetMemberships_WithData_ReturnsAll()
    {
        var package = TestHelpers.SeedPackage(_context);
        TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId);
        TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId);

        var result = _repository.GetMemberships();

        result.Should().HaveCount(2);
    }

    // GetMembershipById 

    [Fact]
    public void GetMembershipById_Exists_ReturnsMembership()
    {
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId);

        var result = _repository.GetMembershipById(membership.MembershipId);

        result.Should().NotBeNull();
        result!.MembershipId.Should().Be(membership.MembershipId);
    }

    [Fact]
    public void GetMembershipById_NotExists_ReturnsNull()
    {
        var result = _repository.GetMembershipById(Guid.NewGuid());

        result.Should().BeNull();
    }

    // CreateMembershipAsync

    [Fact]
    public async Task CreateMembershipAsync_ValidDto_CreatesMembership()
    {
        var package = TestHelpers.SeedPackage(_context);
        var dto = new CreateMembershipDto
        {
            UserId = Guid.NewGuid(),
            PackageId = package.PackageId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = MembershipStatus.Active
        };

        var result = await _repository.CreateMembershipAsync(dto);

        result.Should().NotBeNull();
        result.PackageId.Should().Be(package.PackageId);
        result.Status.Should().Be(MembershipStatus.Active);
        _context.Memberships.Should().HaveCount(1);
    }

    [Fact]
    public async Task CreateMembershipAsync_DuplicateActiveMembership_CancelsPrevious()
    {
        var package = TestHelpers.SeedPackage(_context);
        var userId = Guid.NewGuid();
        var oldMembership = TestHelpers.SeedMembership(_context, userId, package.PackageId);

        var dto = new CreateMembershipDto
        {
            UserId = userId,
            PackageId = package.PackageId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = MembershipStatus.Active
        };

        var result = await _repository.CreateMembershipAsync(dto);

        result.Should().NotBeNull();
        
        // Ensure old membership was cancelled
        var oldInDb = await _context.Memberships.FindAsync(oldMembership.MembershipId);
        oldInDb!.Status.Should().Be(MembershipStatus.Cancelled);
        oldInDb.CancelledDate.Should().NotBeNull();
    }

    //  UpdateMembership 

    [Fact]
    public void UpdateMembership_Exists_UpdatesFields()
    {
        var package = TestHelpers.SeedPackage(_context);
        var userId = Guid.NewGuid();
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId);

        var dto = new CreateMembershipDto
        {
            UserId = userId,
            PackageId = package.PackageId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(60),
            Status = MembershipStatus.Suspended
        };

        var result = _repository.UpdateMembership(membership.MembershipId, dto);

        result.Should().NotBeNull();
        result!.Status.Should().Be(MembershipStatus.Suspended);
    }

    [Fact]
    public void UpdateMembership_CancelledToActive_ThrowsException()
    {
        var package = TestHelpers.SeedPackage(_context);
        var userId = Guid.NewGuid();
        var membership = TestHelpers.SeedMembership(_context, userId, package.PackageId, MembershipStatus.Cancelled);

        var dto = new CreateMembershipDto
        {
            UserId = userId,
            PackageId = package.PackageId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = MembershipStatus.Active
        };

        var act = () => _repository.UpdateMembership(membership.MembershipId, dto);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot reactivate cancelled membership.");
    }

    //  DeleteMembership 

    [Fact]
    public void DeleteMembership_Exists_RemovesFromDb()
    {
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId);

        _repository.DeleteMembership(membership.MembershipId);

        _context.Memberships.Should().BeEmpty();
    }

    [Fact]
    public void DeleteMembership_NotExists_DoesNothing()
    {
        _repository.DeleteMembership(Guid.NewGuid());

        _context.Memberships.Should().BeEmpty();
    }

    //  GetUserMembership 

    [Fact]
    public void GetUserMembership_HasActive_ReturnsActiveMembership()
    {
        var package = TestHelpers.SeedPackage(_context);
        var userId = Guid.NewGuid();
        TestHelpers.SeedMembership(_context, userId, package.PackageId, MembershipStatus.Active);

        var result = _repository.GetUserMembership(userId);

        result.Should().NotBeNull();
        result!.UserId.Should().Be(userId);
        result.Status.Should().Be(MembershipStatus.Active);
    }

    [Fact]
    public void GetUserMembership_OnlyCancelled_ReturnsNull()
    {
        var package = TestHelpers.SeedPackage(_context);
        var userId = Guid.NewGuid();
        TestHelpers.SeedMembership(_context, userId, package.PackageId, MembershipStatus.Cancelled);

        var result = _repository.GetUserMembership(userId);

        result.Should().BeNull();
    }

    // GetMembershipsByStatus 
    [Fact]
    public void GetMembershipsByStatus_FiltersCorrectly()
    {
        var package = TestHelpers.SeedPackage(_context);
        TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId, MembershipStatus.Active);
        TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId, MembershipStatus.Active);
        TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId, MembershipStatus.Cancelled);

        var result = _repository.GetMembershipsByStatus(MembershipStatus.Active);

        result.Should().HaveCount(2);
    }

    // GetMembershipsExpiringIn 

    [Fact]
    public void GetMembershipsExpiringIn_ReturnsCorrectMemberships()
    {
        var package = TestHelpers.SeedPackage(_context);
        TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId, daysUntilExpiry: 5);
        TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId, daysUntilExpiry: 60);

        var result = _repository.GetMembershipsExpiringIn(10);

        result.Should().HaveCount(1);
    }

    //  ExtendMembership 

    [Fact]
    public void ExtendMembership_Active_ExtendsAndReturnsTrue()
    {
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId, daysUntilExpiry: 10);
        var originalEnd = membership.EndDate;

        var result = _repository.ExtendMembership(membership.MembershipId, 30);

        result.Should().BeTrue();
        var updated = _context.Memberships.Find(membership.MembershipId);
        updated!.EndDate.Should().BeCloseTo(originalEnd.AddDays(30), TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void ExtendMembership_NotFound_ReturnsFalse()
    {
        var result = _repository.ExtendMembership(Guid.NewGuid(), 30);

        result.Should().BeFalse();
    }

    // DeactivateMembership

    [Fact]
    public void DeactivateMembership_Active_SetsSuspended()
    {
        var package = TestHelpers.SeedPackage(_context);
        var membership = TestHelpers.SeedMembership(_context, Guid.NewGuid(), package.PackageId);

        _repository.DeactivateMembership(membership.MembershipId);

        var updated = _context.Memberships.Find(membership.MembershipId);
        updated!.Status.Should().Be(MembershipStatus.Suspended);
    }
}

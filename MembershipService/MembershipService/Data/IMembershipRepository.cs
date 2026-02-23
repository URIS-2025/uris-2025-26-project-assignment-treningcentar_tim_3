using MembershipService.Models.DTO;
using MembershipService.Models.Enums;

namespace MembershipService.Data;

public interface IMembershipRepository
{
    // Membership operations
    IEnumerable<MembershipDto> GetMemberships();
    MembershipDto? GetMembershipById(Guid id);
    MembershipDto? GetUserMembership(Guid userId);
    MembershipDto CreateMembership(CreateMembershipDto dto);
    Task<MembershipDto> CreateMembershipAsync(CreateMembershipDto dto);
    MembershipDto? UpdateMembership(Guid id, CreateMembershipDto dto);
    void DeleteMembership(Guid id);
    bool SaveChanges();
    
    // Membership queries/admin
    IEnumerable<MembershipDto> GetMembershipsByStatus(MembershipStatus status);
    IEnumerable<MembershipDto> GetMembershipsExpiringIn(int days);
    IEnumerable<MembershipDto> GetAllMemberships();
    void DeactivateMembership(Guid id);
    bool ExtendMembership(Guid id, int durationDays);
    
    // Package operations
    IEnumerable<PackageDto> GetAllPackages();
    PackageDto? GetPackageById(Guid id);
    bool ValidatePackage(Guid packageId);
    PackageDto? UpdatePackage(Guid id, CreatePackageDto dto);
    bool DeletePackage(Guid id);
    
    // Checkin operations
    void RecordCheckin(Guid userId, DateTime timestamp, string location);
    IEnumerable<CheckinDto> GetCheckinHistory(Guid userId, DateTime? startDate = null, DateTime? endDate = null);
    bool PreventDuplicateCheckinSameDay(Guid userId);
    bool ValidateMembershipForCheckin(Guid userId);
}
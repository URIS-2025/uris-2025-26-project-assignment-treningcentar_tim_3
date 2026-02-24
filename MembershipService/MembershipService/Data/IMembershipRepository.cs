using MembershipService.Models.DTO;
using MembershipService.Models.Enums;

namespace MembershipService.Data;

public interface IMembershipRepository
{
    bool SaveChanges();

    // Membership operations
    IEnumerable<MembershipDto> GetMemberships();
    MembershipDto? GetMembershipById(Guid id);
    MembershipDto? GetUserMembership(Guid userId);
    MembershipDto CreateMembership(CreateMembershipDto dto);
    Task<MembershipDto> CreateMembershipAsync(CreateMembershipDto dto);
    MembershipDto? UpdateMembership(Guid id, CreateMembershipDto dto);
    void DeleteMembership(Guid id);

    // Membership queries/admin
    IEnumerable<MembershipDto> GetMembershipsByStatus(MembershipStatus status);
    IEnumerable<MembershipDto> GetMembershipsExpiringIn(int days);
    IEnumerable<MembershipDto> GetAllMemberships();
    void DeactivateMembership(Guid id);
    bool ExtendMembership(Guid id, int durationDays);
}
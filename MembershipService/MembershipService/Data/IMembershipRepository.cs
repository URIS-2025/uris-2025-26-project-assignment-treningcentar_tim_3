using MembershipService.Models.DTO;

namespace MembershipService.Data;

public interface IMembershipRepository
{
    IEnumerable<MembershipDto> GetMemberships();
    MembershipDto? GetMembershipById(Guid id);
    MembershipDto CreateMembership(CreateMembershipDto dto);
    MembershipDto? UpdateMembership(Guid id, CreateMembershipDto dto);
    void DeleteMembership(Guid id);
    bool SaveChanges();
}
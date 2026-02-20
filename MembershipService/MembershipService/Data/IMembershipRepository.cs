using MembershipService.DTO;

namespace MembershipService.Data;

public interface IMembershipRepository
{
    IEnumerable<MembershipDto> GetMemberships();
    MembershipDto? GetMembershipById(int id);
    MembershipDto CreateMembership(CreateMembershipDto dto);
    MembershipDto? UpdateMembership(int id, CreateMembershipDto dto);
    void DeleteMembership(int id);
    bool SaveChanges();
}
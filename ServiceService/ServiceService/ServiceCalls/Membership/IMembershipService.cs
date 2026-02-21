using ServiceService.ServiceCalls.Membership.DTO;

namespace ServiceService.ServiceCalls.Membership
{
    public interface IMembershipService
    {
        MembershipDTO GetMembershipById(Guid id);

        // opcionalno
        MembershipDTO GetActiveMembershipForUser(Guid userId);
    }
}
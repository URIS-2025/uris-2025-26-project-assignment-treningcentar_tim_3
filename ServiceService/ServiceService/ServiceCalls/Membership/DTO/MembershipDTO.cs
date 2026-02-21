using ServiceService.ServiceCalls.Membership.Enums;

namespace ServiceService.ServiceCalls.Membership.DTO
{
    public class MembershipDTO
    {
        public Guid MembershipId { get; set; }
        public Guid UserId { get; set; }
        public Guid PackageId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? CancelledDate { get; set; }
        public MembershipStatus Status { get; set; }
    }
}

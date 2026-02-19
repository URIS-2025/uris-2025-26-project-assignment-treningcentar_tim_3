using MembershipService.Domain.Enums;

namespace MembershipService.Domain.Entities;

public class Membership
{
    public int MembershipId { get; set; }

    public int PackageId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public MembershipStatus Status { get; set; }

    public Package? Package { get; set; }

    public List<Checkin> Checkins { get; set; } = new();
}

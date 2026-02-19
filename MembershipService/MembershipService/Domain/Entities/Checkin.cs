namespace MembershipService.Domain.Entities;

public class Checkin
{
    public int CheckinId { get; set; }

    public int MembershipId { get; set; }

    public DateTime Timestamp { get; set; }

    public string Location { get; set; } = string.Empty;

    // Navigation property
    public Membership? Membership { get; set; }
}

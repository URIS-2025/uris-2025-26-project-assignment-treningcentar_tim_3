namespace MembershipService.Models;

public class Checkin
{
    public Guid CheckinId { get; set; }

    public Guid MembershipId { get; set; }

    public DateTime Timestamp { get; set; }

    public string Location { get; set; } = string.Empty;

    // Navigation property
    public Membership? Membership { get; set; }
}

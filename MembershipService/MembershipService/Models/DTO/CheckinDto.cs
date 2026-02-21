namespace MembershipService.Models.DTO;

public class CheckinDto
{
    public Guid CheckinId { get; set; }
    public Guid MembershipId { get; set; }
    public Guid UserId { get; set; }
    public DateTime Timestamp { get; set; }
    public string Location { get; set; } = string.Empty;
}

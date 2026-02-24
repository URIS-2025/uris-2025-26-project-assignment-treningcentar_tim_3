namespace MembershipService.Models.DTO;

public class RecordCheckinDto
{
    public Guid UserId { get; set; }
    public DateTime Timestamp { get; set; }
    public string Location { get; set; } = string.Empty;
}
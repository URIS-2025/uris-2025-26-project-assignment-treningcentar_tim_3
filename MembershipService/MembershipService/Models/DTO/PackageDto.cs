namespace MembershipService.Models.DTO;

public class PackageDto
{
    public Guid PackageId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Price { get; set; }
    public int Duration { get; set; }
    public List<string> Services { get; set; } = new();
}

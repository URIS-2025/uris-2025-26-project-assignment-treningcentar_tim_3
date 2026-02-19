namespace MembershipService.Domain.Entities;

public class Package
{
    public int PackageId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public double Price { get; set; }

    public int Duration { get; set; } 

    public List<string> Services { get; set; } = new();
}

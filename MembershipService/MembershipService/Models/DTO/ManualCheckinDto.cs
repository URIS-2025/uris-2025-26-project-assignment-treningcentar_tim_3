using System.ComponentModel.DataAnnotations;

namespace MembershipService.Models.DTO;

public class ManualCheckinDto
{
    [Required(ErrorMessage = "UserId is required.")]
    public Guid UserId { get; set; }

    [Required(ErrorMessage = "Timestamp is required.")]
    public DateTime Timestamp { get; set; }

    [Required(ErrorMessage = "Location is required.")]
    public string Location { get; set; } = string.Empty;
}

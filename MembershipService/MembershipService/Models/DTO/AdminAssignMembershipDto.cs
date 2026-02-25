using System.ComponentModel.DataAnnotations;

namespace MembershipService.Models.DTO;

public class AdminAssignMembershipDto
{
    [Required(ErrorMessage = "UserId is required.")]
    public Guid UserId { get; set; }
    
    [Required(ErrorMessage = "PackageId is required.")]
    public Guid PackageId { get; set; }
    
    [Required(ErrorMessage = "StartDate is required.")]
    public DateTime StartDate { get; set; }
}

using System;
using MembershipService.Models.Enums;
namespace MembershipService.Models.DTO;

public class MembershipDto
{
    public Guid MembershipId { get; set; }
    public Guid UserId { get; set; }
    public Guid PackageId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public MembershipStatus Status { get; set; } 
}

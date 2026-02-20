using System;
using MembershipService.Domain.Enums;
namespace MembershipService.DTO;

public class MembershipDto
{
    public int MembershipId { get; set; }
    public int PackageId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public MembershipStatus Status { get; set; } 
}
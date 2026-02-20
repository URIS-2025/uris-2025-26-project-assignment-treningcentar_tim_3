using System.ComponentModel.DataAnnotations;
using MembershipService.Domain.Enums;

namespace MembershipService.DTO;


public class CreateMembershipDto
{
    //ID paketa
    [Required(ErrorMessage = "PackageId is required.")]
    public Guid PackageId { get; set; }
    //Datum početka članarine
    [Required(ErrorMessage = "StartDate is required.")]
    public DateTime StartDate { get; set; }
    //Datum završetka članarine
    [Required(ErrorMessage = "EndDate is required.")]
    public DateTime EndDate { get; set; }
    //Status članarine
    
    [Required(ErrorMessage = "Status is required.")]
    [EnumDataType(typeof(MembershipStatus), ErrorMessage = "Invalid status value.")]
    public MembershipStatus Status { get; set; }
}
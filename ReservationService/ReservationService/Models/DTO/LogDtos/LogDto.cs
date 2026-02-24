using ReservationService.Models.DTO.LogDtos;

namespace ReservationService.Models.DTO.MemberDtos;

public class LogDto : LogCreationDto
{
    public Guid Id { get; set; }
}
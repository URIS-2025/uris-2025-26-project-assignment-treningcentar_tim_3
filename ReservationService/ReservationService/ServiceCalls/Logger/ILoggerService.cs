using ReservationService.Models.DTO.LogDtos;
using ReservationService.Models.DTO.MemberDtos;

namespace ReservationService.ServiceCalls.Logger;

public interface IServiceLogger
{
    LogDto CreateLog(LogCreationDto dto);
}
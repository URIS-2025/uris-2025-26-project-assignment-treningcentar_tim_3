using ReservationService.Models.DTO.MemberDtos;

namespace ReservationService.ServiceCalls.User;

public interface IUserService
{
    MemberDto GetMemberById(Guid id);
}
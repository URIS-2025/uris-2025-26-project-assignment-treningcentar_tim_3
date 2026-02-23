using ReservationService.Models.DTO.MemberDtos;
using ReservationService.Models.Enums;

namespace ReservationService.Models.DTO
{
    public class ReservationDto
    {
        public Guid ReservationId { get; set; }
        // public Guid UserId { get; set; }
        public MemberDto Member { get; set; }
        public Guid SessionId { get; set; }
        public ReservationStatus Status { get; set; }
    }
}
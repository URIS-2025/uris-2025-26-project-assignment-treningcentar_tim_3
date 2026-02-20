using AutoMapper;
using MembershipService.Models;
using MembershipService.Models.DTO;

namespace MembershipService.Profiles
{
    public class MembershipProfile : Profile
    {
        public MembershipProfile()
        {
            // Mapiranje iz Entiteta u DTO 
            CreateMap<Membership, MembershipDto>();

            // Mapiranje iz CreateDTO u Entitet 
            CreateMap<CreateMembershipDto, Membership>();
        } 
    }
}
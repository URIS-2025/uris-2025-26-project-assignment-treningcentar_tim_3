using AutoMapper;
using MembershipService.Models;
using MembershipService.Models.DTO;

namespace MembershipService.Profiles
{
    public class MembershipProfile : Profile
    {
        public MembershipProfile()
        {
            // Membership mappings
            CreateMap<Membership, MembershipDto>();
            CreateMap<CreateMembershipDto, Membership>();

            // Package mappings
            CreateMap<Package, PackageDto>();
            CreateMap<CreatePackageDto, Package>();

            // Checkin mappings
            CreateMap<Checkin, CheckinDto>();
        } 
    }
}
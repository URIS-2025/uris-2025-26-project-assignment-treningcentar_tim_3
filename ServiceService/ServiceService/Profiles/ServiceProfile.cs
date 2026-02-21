using AutoMapper;
using ServiceService.Models;
using ServiceService.Models.DTO;

namespace ServiceService.Profiles
{
    public class ServiceProfile : Profile
    {
        public ServiceProfile()
        {
            CreateMap<Service, ServiceDTO>();

            CreateMap<ServiceCreationDTO, Service>();

            CreateMap<ServiceUpdateDTO, Service>();
        }
    }
}
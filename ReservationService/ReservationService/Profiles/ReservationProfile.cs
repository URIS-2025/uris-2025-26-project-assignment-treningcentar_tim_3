using AutoMapper;
using ReservationService.Models;
using ReservationService.Models.DTO;

namespace ReservationService.Profiles
{
    public class ReservationProfile : Profile
    {
        public ReservationProfile()
        {
            CreateMap<Reservation, ReservationDto>();
            CreateMap<ReservationCreateDto, Reservation>();
        }
    }
}